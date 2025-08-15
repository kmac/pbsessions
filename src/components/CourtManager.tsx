import React, { useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  Card,
  Icon,
  IconButton,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { Court } from '../types';
import { APP_CONFIG } from '../constants';
import { Alert } from '../utils/alert'

interface CourtManagerProps {
  visible: boolean;
  courts: Court[];
  onCourtsChange: (courts: Court[]) => void;
  onClose: () => void;
}

export default function CourtManager({
  visible,
  courts,
  onCourtsChange,
  onClose
}: CourtManagerProps) {
  const theme = useTheme();
  const [localCourts, setLocalCourts] = useState<Court[]>(courts);

  const handleSave = () => {
    const activeCourts = localCourts.filter(c => c.isActive);
    if (activeCourts.length === 0) {
      Alert.alert('Validation Error', 'At least one court must be active');
      return;
    }

    onCourtsChange(localCourts);
    onClose();
  };

  const addCourt = () => {
    if (localCourts.length >= APP_CONFIG.MAX_COURTS) {
      Alert.alert('Maximum Courts', `Cannot have more than ${APP_CONFIG.MAX_COURTS} courts`);
      return;
    }

    const newCourt: Court = {
      id: `court${localCourts.length + 1}`,
      name: `Court ${localCourts.length + 1}`,
      number: localCourts.length + 1,
      minimumRating: undefined,
      isActive: true,
    };
    setLocalCourts([...localCourts, newCourt]);
  };

  const removeCourt = (courtId: string) => {
    if (localCourts.length <= 1) {
      Alert.alert('Cannot Remove', 'Must have at least one court');
      return;
    }
    setLocalCourts(localCourts.filter(c => c.id !== courtId));
  };

  const updateCourt = (courtId: string, updates: Partial<Court>) => {
    setLocalCourts(localCourts.map(court =>
      court.id === courtId ? { ...court, ...updates } : court
    ));
  };

  const toggleCourt = (courtId: string) => {
    const court = localCourts.find(c => c.id === courtId);
    if (!court) {
      return;
    }
    const activeCourts = localCourts.filter(c => c.isActive);
    if (court.isActive && activeCourts.length === 1) {
      Alert.alert('Cannot Deactivate', 'At least one court must be active');
      return;
    }
    updateCourt(courtId, { isActive: !court.isActive });
  };

  const setMinimumRating = (courtId: string, rating: string) => {
    const numRating = rating ? parseFloat(rating) : undefined;
    if (rating && (isNaN(numRating!) || numRating! < 0 || numRating! > 10)) {
      return;
    }
    updateCourt(courtId, { minimumRating: numRating });
  };

  function setCourtName(courtId: string, name: string) {
    updateCourt(courtId, { name: name });
  };

  const activeCourts = localCourts.filter(c => c.isActive);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={onClose} />
          <Appbar.Content
            title="Court Configuration"
            titleStyle={{ fontWeight: '600' }}
          />
          <Button
            icon="content-save"
            mode="contained"
            onPress={handleSave}
            style={{ marginRight: 8 }}
          >
            Save
          </Button>
        </Appbar.Header>

        <ScrollView
          style={{ flex: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Surface style={{
            borderRadius: 12,
            padding: 16,
            marginBottom: 24
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around'
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text variant="headlineMedium" style={{
                  fontWeight: 'bold',
                  color: theme.colors.primary,
                  marginBottom: 4
                }}>
                  {localCourts.length}
                </Text>
                <Text variant="labelMedium" style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: 'center'
                }}>
                  Total Courts
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text variant="headlineMedium" style={{
                  fontWeight: 'bold',
                  color: theme.colors.primary,
                  marginBottom: 4
                }}>
                  {activeCourts.length}
                </Text>
                <Text variant="labelMedium" style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: 'center'
                }}>
                  Active Courts
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text variant="headlineMedium" style={{
                  fontWeight: 'bold',
                  color: theme.colors.primary,
                  marginBottom: 4
                }}>
                  {activeCourts.length * 4}
                </Text>
                <Text variant="labelMedium" style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: 'center'
                }}>
                  Players per Game
                </Text>
              </View>
            </View>
          </Surface>

          <View style={{ marginBottom: 24 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <Text variant="titleLarge" style={{ fontWeight: '600' }}>
                Courts
              </Text>
              <Button
                icon="plus"
                mode="outlined"
                onPress={addCourt}
                disabled={localCourts.length >= APP_CONFIG.MAX_COURTS}
              >
                Add Court
              </Button>
            </View>

            {localCourts.map((court, index) => (
              <Card
                key={court.id}
                style={{
                  marginBottom: 12,
                  opacity: court.isActive ? 1 : 0.7
                }}
              >
                <Card.Content>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: court.isActive ? 12 : 0,
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      flex: 1,
                      gap: 12,
                    }}>
                      <View style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        // backgroundColor: COURT_COLORS[index % COURT_COLORS.length]
                      }} />
                      <Text variant="titleMedium" style={{
                        fontWeight: '600',
                        // flex: 1,
                        color: court.isActive ? theme.colors.onSurface : theme.colors.onSurfaceVariant
                      }}>
                        {court.name ? court.name : `Court ${court.number}`}
                      </Text>
                      <TextInput
                        mode="flat"
                        value={court.name ? court.name : `Court ${court.number}`}
                        onChangeText={(text) => setCourtName(court.id, text)}
                        placeholder="Optional"
                        keyboardType="default"
                        dense
                        style={{
                          /*width: 80,*/
                          textAlign: 'left',
                          fontWeight: '600',
                          // flex: 2,
                          color: court.isActive ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                        }}
                      />
                      <Switch
                        value={court.isActive}
                        onValueChange={() => toggleCourt(court.id)}
                      />
                    </View>

                    {localCourts.length > 1 && (
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => removeCourt(court.id)}
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </View>

                  {court.isActive && (
                    <Surface style={{
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: theme.colors.surfaceVariant
                    }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          // flex: 1,
                          gap: 8,
                        }}>
                          <Icon source="star-outline" size={16} />
                          <Text variant="labelMedium" style={{
                            fontWeight: '500',
                            marginRight: 10
                          }}>
                            Minimum Rating
                          </Text>
                        </View>
                        <TextInput
                          mode="outlined"
                          value={court.minimumRating?.toString() || ''}
                          onChangeText={(text) => setMinimumRating(court.id, text)}
                          placeholder="e.g. 3.5"
                          keyboardType="decimal-pad"
                          dense
                          style={{ width: 100, textAlign: 'center' }}
                        />
                      </View>
                      <Text variant="bodySmall" style={{
                        color: theme.colors.onSurfaceVariant,
                        fontStyle: 'italic'
                      }}>
                        Only players with this rating or higher can be assigned to this court
                      </Text>
                    </Surface>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>

          {activeCourts.some(c => c.minimumRating) && (
            <Surface style={{
              borderRadius: 12,
              padding: 16,
              backgroundColor: theme.colors.tertiaryContainer
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <Icon source="cog-outline" size={20} />
                <Text variant="titleMedium" style={{
                  fontWeight: '600',
                  color: theme.colors.onTertiaryContainer
                }}>
                  Rating Requirements
                </Text>
              </View>
              <Text variant="bodyMedium" style={{
                color: theme.colors.onTertiaryContainer,
                lineHeight: 20
              }}>
                Courts with minimum ratings will prioritize players based on skill level.
                Players without ratings will be assigned to courts without minimum requirements.
              </Text>
            </Surface>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

