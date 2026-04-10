import { useState, useCallback, useEffect } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialPresent: T, key: string) {
  // Load from local storage if available, otherwise use initial
  const [state, setState] = useState<HistoryState<T>>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Validate minimal structure (check if array)
        if (Array.isArray(parsed)) {
            return {
                past: [],
                present: parsed as T,
                future: []
            };
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    return {
      past: [],
      present: initialPresent,
      future: [],
    };
  });

  // Save to local storage whenever 'present' changes
  useEffect(() => {
    try {
        window.localStorage.setItem(key, JSON.stringify(state.present));
    } catch (error) {
        console.warn(`Error saving to localStorage key "${key}":`, error);
    }
  }, [state.present, key]);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    setState((currentState) => {
      const { past, present, future } = currentState;
      if (past.length === 0) return currentState;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((currentState) => {
      const { past, present, future } = currentState;
      if (future.length === 0) return currentState;

      const next = future[0];
      const newFuture = future.slice(1);

      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const set = useCallback((newPresent: T) => {
    setState((currentState) => {
      // If the new state is identical to current, don't add to history
      if (JSON.stringify(currentState.present) === JSON.stringify(newPresent)) {
          return currentState;
      }

      return {
        past: [...currentState.past, currentState.present],
        present: newPresent,
        future: [],
      };
    });
  }, []);

  // For loading a completely new state (e.g. from file upload)
  const loadState = useCallback((newPresent: T) => {
      setState({
          past: [],
          present: newPresent,
          future: []
      });
  }, []);

  return { 
      state: state.present, 
      set, 
      undo, 
      redo, 
      canUndo, 
      canRedo,
      loadState 
  };
}
