// src/hooks/useStorage.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { StorageManager } from '../utils/storage';
import { setPlayers } from '../store/slices/playersSlice';
import { setGroups } from '../store/slices/groupsSlice';

export const useStorageLoader = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadInitialData = async () => {
      const storage = StorageManager.getInstance();

      try {
        const [players, groups] = await Promise.all([
          storage.loadPlayers(),
          storage.loadGroups(),
        ]);

        dispatch(setPlayers(players));
        dispatch(setGroups(groups));
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [dispatch]);
};


