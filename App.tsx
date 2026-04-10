
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Scene } from './components/Scene';
import { Controls } from './components/Controls';
import { SceneObject, ItemType, TransformMode, EnvironmentSettings, CameraMode } from './types';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from './hooks/useHistory';

const INITIAL_SETTINGS: EnvironmentSettings = {
  floorColor: '#38bdf8',
  floorTextureUrl: null,
  showGrid: true,
  referenceImage: null,
  referenceOpacity: 0.5
};

// Initial walls to replace the hardcoded ones in Scene
const INITIAL_OBJECTS: SceneObject[] = [
    {
        id: 'wall-1',
        type: ItemType.WALL,
        position: [0, 5, -10],
        rotation: [0, 0, 0],
        scale: [20, 10, 1],
        customColors: { paint: '#78350f' }
    },
    {
        id: 'wall-2',
        type: ItemType.WALL,
        position: [-10, 5, 0],
        rotation: [0, Math.PI/2, 0],
        scale: [20, 10, 1],
        customColors: { paint: '#78350f' }
    }
];

const getDefaultColors = (type: ItemType): Record<string, string> => {
    switch(type) {
        case ItemType.TABLE_SQUARE: return { top: '#a0522d', legs: '#3e2723' };
        case ItemType.COUNTER_STRAIGHT:
        case ItemType.COUNTER_CORNER: return { body: '#4FD1C5', top: '#2d3748', detail: '#38B2AC' };
        case ItemType.CHAIR: return { seat: '#5D4037', wood: '#3E2723' };
        case ItemType.STOVE: return { body: '#A0AEC0', top: '#1a202c' };
        case ItemType.FRIDGE: return { body: '#4FD1C5', handle: '#CBD5E0' };
        case ItemType.SINK: return { body: '#4FD1C5', top: '#2d3748', basin: '#E2E8F0' };
        case ItemType.DECOR_PAN: return { pan: '#ef4444' };
        case ItemType.PLANT: return { pot: '#d97706' };
        case ItemType.DECOR_BOARD: return { board: '#d97706' };
        case ItemType.DECOR_FLAG: return { stripe1: '#006847', stripe2: '#FFFFFF', stripe3: '#CE1126' };
        case ItemType.DECOR_RUG: return { base: '#f59e0b', stripe1: '#b45309', stripe2: '#047857' };
        case ItemType.WALL: return { paint: '#ffffff' };
        
        case ItemType.FOOD_TOMATO: return { skin: '#ef4444', stem: '#166534' };
        case ItemType.FOOD_CHEESE: return { cheese: '#fcd34d' };
        case ItemType.FOOD_PEPPERONI: return { meat: '#b91c1c' };
        case ItemType.FOOD_WHEAT: return { stalk: '#d97706', grain: '#fbbf24', tie: '#92400e' };
        case ItemType.FOOD_MILK: return { box: '#f1f5f9', label: '#3b82f6' };
        case ItemType.FOOD_EGGPLANT: return { skin: '#581c87', top: '#15803d' };
        case ItemType.FOOD_ZUCCHINI: return { skin: '#15803d' };

        default: return { main: '#ffffff' };
    }
};

const App: React.FC = () => {
  const { 
      state: objects, 
      set: setObjects, 
      undo, redo, canUndo, canRedo, loadState 
  } = useHistory<SceneObject[]>(INITIAL_OBJECTS, 'kitchen-planner-save-v2');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit');
  const [settings, setSettings] = useState<EnvironmentSettings>(INITIAL_SETTINGS);
  const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false);
  
  const clipboardRef = useRef<SceneObject[] | null>(null);

  const handleSelect = (id: string | null, multi: boolean) => {
      if (!id) {
          setSelectedIds([]);
          return;
      }

      if (multi) {
          setSelectedIds(prev => 
              prev.includes(id) 
                  ? prev.filter(pid => pid !== id) 
                  : [...prev, id]
          );
      } else {
          setSelectedIds([id]);
      }
  };

  const handleRemoveObject = (id: string) => {
    const newObjects = objects.filter((o) => o.id !== id);
    setObjects(newObjects);
    setSelectedIds(prev => prev.filter(pid => pid !== id));
  };

  const handleTransform = useCallback((id: string, newProps: Partial<SceneObject>) => {
    setObjects(
      objects.map((obj) => obj.id === id ? { ...obj, ...newProps } : obj)
    );
  }, [objects, setObjects]);

  const handleGroupTransform = useCallback((changes: {id: string, changes: Partial<SceneObject>}[]) => {
      setObjects(
          objects.map(obj => {
              const change = changes.find(c => c.id === obj.id);
              return change ? { ...obj, ...change.changes } : obj;
          })
      )
  }, [objects, setObjects]);

  const handleUpdateObjectColor = (id: string, slot: string, color: string) => {
     setObjects(
        objects.map((obj) => {
            if (obj.id === id) {
                return {
                    ...obj,
                    customColors: { ...obj.customColors, [slot]: color }
                };
            }
            return obj;
        })
     );
  };

  const handleUpdateObjectTexture = (id: string, url: string) => {
      setObjects(
          objects.map(obj => obj.id === id ? { ...obj, textureUrl: url } : obj)
      );
  }

  const handleAddCustomModel = (url: string, format: 'fbx' | 'glb' | 'gltf') => {
      const newObject: SceneObject = {
        id: uuidv4(),
        type: ItemType.CUSTOM_MODEL,
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        customColors: {},
        modelUrl: url,
        modelFormat: format
      };
      setObjects([...objects, newObject]);
      setSelectedIds([newObject.id]);
  }

  const handleDropObject = (type: ItemType, position: [number, number, number] = [0, 0, 0]) => {
      const newObject: SceneObject = {
        id: uuidv4(),
        type,
        position,
        rotation: [0, 0, 0],
        scale: type === ItemType.WALL ? [5, 3, 0.2] : [1, 1, 1],
        customColors: getDefaultColors(type)
      };
      setObjects([...objects, newObject]);
      setSelectedIds([newObject.id]);
      setIsAssetLibraryOpen(false);
  };

  // --- Copy / Paste Logic (Supports Multi) ---
  const handleCopy = useCallback(() => {
      if (selectedIds.length > 0) {
          const toCopy = objects.filter(o => selectedIds.includes(o.id));
          clipboardRef.current = toCopy;
      }
  }, [selectedIds, objects]);

  const handlePaste = useCallback(() => {
      if (clipboardRef.current && clipboardRef.current.length > 0) {
          const newSelection: string[] = [];
          
          const newObjects = clipboardRef.current.map(original => {
             const newId = uuidv4();
             newSelection.push(newId);
             return {
                 ...original,
                 id: newId,
                 position: [original.position[0] + 1, original.position[1], original.position[2] + 1] as [number,number,number]
             }
          });
          
          setObjects([...objects, ...newObjects]);
          setSelectedIds(newSelection);
      }
  }, [objects, setObjects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        const isCtrlOrMeta = e.ctrlKey || e.metaKey;

        if (isCtrlOrMeta) {
            switch(e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) redo(); 
                    else undo();
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
                case 'c':
                    handleCopy();
                    break;
                case 'v':
                    handlePaste();
                    break;
            }
        } else {
            if (e.key.toLowerCase() === 'a') {
                setIsAssetLibraryOpen(prev => !prev);
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
                selectedIds.forEach(id => handleRemoveObject(id));
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, handleCopy, handlePaste, selectedIds, handleRemoveObject]);

  const handleSaveFile = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(objects));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "kitchen_layout.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (Array.isArray(json)) loadState(json);
              else alert("Invalid file format");
          } catch (err) { alert("Error reading file"); }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  return (
    <div className="flex h-screen w-screen bg-gray-950 overflow-hidden font-sans text-gray-200">
      <Controls 
        objects={objects}
        onRemove={handleRemoveObject}
        selectedIds={selectedIds}
        transformMode={transformMode}
        setTransformMode={setTransformMode}
        cameraMode={cameraMode}
        setCameraMode={setCameraMode}
        settings={settings}
        setSettings={setSettings}
        updateObjectColor={handleUpdateObjectColor}
        updateObjectTexture={handleUpdateObjectTexture}
        onAddCustomModel={handleAddCustomModel}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSaveFile={handleSaveFile}
        onLoadFile={handleLoadFile}
        isAssetLibraryOpen={isAssetLibraryOpen}
        setIsAssetLibraryOpen={setIsAssetLibraryOpen}
        onAddObject={handleDropObject}
      />
      
      <div className="flex-1 relative h-full">
        <Scene 
          objects={objects}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onTransform={handleTransform}
          onGroupTransform={handleGroupTransform}
          transformMode={transformMode}
          cameraMode={cameraMode}
          settings={settings}
          onDropObject={handleDropObject}
        />
      </div>
    </div>
  );
};

export default App;
