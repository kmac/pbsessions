import { Player } from "@/src/types";
import { parsePlayersFromCsv } from "@/src/utils/csv";

// Mock data for testing
const mockAllPlayers: Player[] = [
  {
    id: "1",
    name: "Existing Player",
    email: "existing@test.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("parsePlayersFromCsv", () => {
  describe("Valid CSV parsing", () => {
    it("should parse valid CSV with all fields", () => {
      const csvContent = `name,email,phone,gender,rating,notes
"John Doe","john@example.com","555-1234","male",4.5,"Good player"
"Jane Smith","jane@example.com","555-5678","female",3.0,"Beginner"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0]).toEqual({
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        gender: "male",
        rating: 4.5,
        notes: "Good player",
      });
      expect(result.importedPlayers[1]).toEqual({
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "555-5678",
        gender: "female",
        rating: 3.0,
        notes: "Beginner",
      });
    });

    it("should parse CSV with only required name field", () => {
      const csvContent = `name
"John Doe"
"Jane Smith"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0]).toEqual({
        name: "John Doe",
        email: undefined,
        phone: undefined,
        gender: undefined,
        rating: undefined,
        notes: undefined,
      });
    });

    it("should handle CSV with empty optional fields", () => {
      const csvContent = `name,email,phone,gender,rating,notes
"John Doe","","","","",""
"Jane Smith","jane@example.com","","female","","Good player"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0]).toEqual({
        name: "John Doe",
        email: undefined,
        phone: undefined,
        gender: undefined,
        rating: undefined,
        notes: undefined,
      });
      expect(result.importedPlayers[1]).toEqual({
        name: "Jane Smith",
        email: "jane@example.com",
        phone: undefined,
        gender: "female",
        rating: undefined,
        notes: "Good player",
      });
    });
  });

  describe("Header validation", () => {
    it("should reject CSV with invalid headers", () => {
      const csvContent = `name,email,invalidheader,gender
"John Doe","john@example.com","invalid","male"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "Invalid header(s) found: invalidheader",
      );
      expect(result.importedPlayers).toHaveLength(0);
    });

    it("should reject CSV without name header", () => {
      const csvContent = `email,phone,gender
"john@example.com","555-1234","male"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('CSV must contain a "name" column.');
      expect(result.importedPlayers).toHaveLength(0);
    });

    it("should accept CSV with subset of valid headers", () => {
      const csvContent = `name,email,rating
"John Doe","john@example.com",4.5`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0]).toEqual({
        name: "John Doe",
        email: "john@example.com",
        phone: undefined,
        gender: undefined,
        rating: 4.5,
        notes: undefined,
      });
    });
  });

  describe("Data validation", () => {
    it("should reject rows with empty names", () => {
      const csvContent = `name,email
"","john@example.com"
"Jane Smith","jane@example.com"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe("Row 2: Name is required");
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0].name).toBe("Jane Smith");
    });

    it("should reject duplicate player names", () => {
      const csvContent = `name,email
"Existing Player","existing@example.com"
"New Player","new@example.com"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(
        'Row 2: Player "Existing Player" already exists',
      );
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0].name).toBe("New Player");
    });

    it("should validate rating range", () => {
      const csvContent = `name,rating
"John Doe",4.5
"Jane Smith",11
"Bob Johnson",-1
"Alice Brown",abc`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(3);
      expect(result.errors[0]).toContain('Row 3: Invalid rating "11"');
      expect(result.errors[1]).toContain('Row 4: Invalid rating "-1"');
      expect(result.errors[2]).toContain('Row 5: Invalid rating "abc"');
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0].name).toBe("John Doe");
      expect(result.importedPlayers[0].rating).toBe(4.5);
    });

    it("should validate gender values", () => {
      const csvContent = `name,gender
"John Doe","male"
"Jane Smith","female"
"Bob Johnson","other"
"Alice Brown","invalid"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('Row 4: Invalid gender "other" (must be: male, female)');
      expect(result.errors[1]).toContain('Row 5: Invalid gender "invalid" (must be: male, female)');
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0].gender).toBe("male");
      expect(result.importedPlayers[1].gender).toBe("female");
    });
  });

  describe("CSV format handling", () => {
    it("should handle CSV with quoted fields containing commas", () => {
      const csvContent = `name,notes
"John Doe","Good player, very skilled"
"Jane Smith","Notes with ""quotes"" inside"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0].notes).toBe("Good player, very skilled");
      expect(result.importedPlayers[1].notes).toBe(
        'Notes with "quotes" inside',
      );
    });

    it("should handle empty CSV", () => {
      const csvContent = "";

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(
        "CSV data must contain headers and at least one data row.",
      );
      expect(result.importedPlayers).toHaveLength(0);
    });

    it("should handle CSV with only headers", () => {
      const csvContent = "name,email,phone";

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(
        "CSV data must contain headers and at least one data row.",
      );
      expect(result.importedPlayers).toHaveLength(0);
    });
  });

  describe("Case sensitivity and trimming", () => {
    it("should handle case-insensitive headers", () => {
      const csvContent = `NAME,EMAIL,PHONE,GENDER,RATING,NOTES
"John Doe","john@example.com","555-1234","MALE",4.5,"Good player"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0]).toEqual({
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        gender: "male",
        rating: 4.5,
        notes: "Good player",
      });
    });

    it("should trim whitespace from values", () => {
      const csvContent = `name,email
"  John Doe  ","  john@example.com  "`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0].name).toBe("John Doe");
      expect(result.importedPlayers[0].email).toBe("john@example.com");
    });

    it("should handle case-insensitive duplicate detection", () => {
      const csvContent = `name,email
"existing player","test@example.com"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(
        'Row 2: Player "existing player" already exists',
      );
      expect(result.importedPlayers).toHaveLength(0);
    });
  });

  describe("Error handling", () => {
    it("should continue processing after individual row errors", () => {
      const csvContent = `name,rating
"John Doe",4.5
"",3.0
"Jane Smith","invalid"
"Bob Johnson",5.0`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toBe("Row 3: Name is required");
      expect(result.errors[1]).toContain('Row 4: Invalid rating "invalid"');
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0].name).toBe("John Doe");
      expect(result.importedPlayers[1].name).toBe("Bob Johnson");
    });

    it("should handle malformed CSV gracefully", () => {
      const csvContent = `name,email
"John Doe","john@example.com"
"Jane Smith"unclosed quote`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      // Should still process the valid row
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0].name).toBe("John Doe");
    });
  });
});

