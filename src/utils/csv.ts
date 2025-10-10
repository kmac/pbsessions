import { Player, Session, Game, Round } from "@/src/types";
import { getSessionPlayers, getPlayerName, getCourtName } from "./util";

export const parsePlayersFromCsv = (
  allPlayers: Player[],
  csvContent: string,
): {
  importedPlayers: Omit<Player, "id" | "createdAt" | "updatedAt">[];
  errors: string[];
} => {
  const importedPlayers: Omit<Player, "id" | "createdAt" | "updatedAt">[] = [];
  const errors: string[] = [];

  try {
    // Parse CSV
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) {
      errors.push("CSV data must contain headers and at least one data row.");
      return { importedPlayers, errors };
    }

    const headers = lines[0]
      .split(",")
      .map((h) => h.replace(/"/g, "").trim().toLowerCase());
    const expectedHeaders = [
      "name",
      "email",
      "phone",
      "gender",
      "rating",
      "notes",
    ];

    // Validate headers - check if all headers are expected
    const invalidHeaders = headers.filter(
      (header) => !expectedHeaders.includes(header),
    );
    if (invalidHeaders.length > 0) {
      errors.push(
        `Invalid header(s) found: ${invalidHeaders.join(", ")}. Expected headers: ${expectedHeaders.join(", ")}`,
      );
      return { importedPlayers, errors };
    }

    // Validate that name header exists (required field)
    if (!headers.includes("name")) {
      errors.push('CSV must contain a "name" column.');
      return { importedPlayers, errors };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        // Parse CSV row with proper quote handling
        const values: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];
          if (char === '"') {
            if (inQuotes && lines[i][j + 1] === '"') {
              current += '"';
              j++; // Skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim()); // Add last value

        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || "";
        });

        // Validate required fields
        if (!rowData.name || rowData.name.trim() === "") {
          errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }

        // Check for duplicate names (case-insensitive)
        const existingPlayer = allPlayers.find(
          (p) =>
            p.name.toLowerCase().trim() === rowData.name.toLowerCase().trim(),
        );
        if (existingPlayer) {
          errors.push(`Row ${i + 1}: Player "${rowData.name}" already exists`);
          continue;
        }

        // Validate and convert rating
        let rating: number | undefined = undefined;
        if (rowData.rating && rowData.rating.trim() !== "") {
          const ratingNum = parseFloat(rowData.rating);
          if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
            errors.push(
              `Row ${i + 1}: Invalid rating "${rowData.rating}" (must be 0-10)`,
            );
            continue;
          }
          rating = ratingNum;
        }

        // Validate gender
        const validGenders = ["male", "female"];
        let gender: "male" | "female" | undefined = undefined;
        if (rowData.gender && rowData.gender.trim() !== "") {
          const genderLower = rowData.gender.toLowerCase().trim();
          if (!validGenders.includes(genderLower)) {
            errors.push(
              `Row ${i + 1}: Invalid gender "${rowData.gender}" (must be: male, female)`,
            );
            continue;
          }
          gender = genderLower as "male" | "female";
        }

        // Create player object
        const playerData: Omit<Player, "id" | "createdAt" | "updatedAt"> = {
          name: rowData.name.trim(),
          email: rowData.email?.trim() || undefined,
          phone: rowData.phone?.trim() || undefined,
          gender: gender,
          rating: rating,
          notes: rowData.notes?.trim() || undefined,
        };

        importedPlayers.push(playerData);
      } catch (error) {
        errors.push(
          `Row ${i + 1}: Parse error - ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  } catch (error) {
    errors.push(
      `Parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  return { importedPlayers, errors };
};

// Helper function to escape CSV values
const escapeCsvValue = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined) return "";

  const str = String(value);
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportSessionResultsToCsv = (
  session: Session,
  allPlayers: Player[],
): string => {
  const sessionPlayers = getSessionPlayers(session, allPlayers);
  const rounds = session.liveData?.rounds || [];

  const headers = [
    "Round - Court",
    "Serve Player 1",
    "Serve Player 2",
    "Serve Score",
    "Receive Player 1",
    "Receive Player 2",
    "Receive Score",
  ];

  const csvRows: string[] = [];
  csvRows.push(headers.join(","));

  // Generate data rows
  rounds.forEach((round: Round, roundIndex: number) => {
    round.games.forEach((game: Game) => {
      const courtName = getCourtName(session.courts, game.courtId);
      const servePlayer1Name = getPlayerName(
        sessionPlayers,
        game.serveTeam.player1Id,
      );
      const servePlayer2Name = getPlayerName(
        sessionPlayers,
        game.serveTeam.player2Id,
      );
      const receivePlayer1Name = getPlayerName(
        sessionPlayers,
        game.receiveTeam.player1Id,
      );
      const receivePlayer2Name = getPlayerName(
        sessionPlayers,
        game.receiveTeam.player2Id,
      );

      const row = [
        escapeCsvValue(`${roundIndex + 1} - ${courtName}`),
        escapeCsvValue(servePlayer1Name),
        escapeCsvValue(servePlayer2Name),
        escapeCsvValue(game.score?.serveScore),
        escapeCsvValue(receivePlayer1Name),
        escapeCsvValue(receivePlayer2Name),
        escapeCsvValue(game.score?.receiveScore),
      ];

      csvRows.push(row.join(","));
    });
  });

  return csvRows.join("\n");
};
