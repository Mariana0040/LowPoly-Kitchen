
import React, { useRef, useState, useEffect } from 'react';
import { 
  Move, Rotate3d, Maximize, Trash2, X,
  Square, Grid, Upload, Image as ImageIcon,
  Palette, MousePointer2, Hand, LayoutGrid,
  Box, Undo2, Redo2, Save, FolderOpen, Copy, FileJson, Layers
} from 'lucide-react';
import { ItemType, TransformMode, SceneObject, EnvironmentSettings, CameraMode } from '../types';

interface ControlsProps {
  objects: SceneObject[];
  onRemove: (id: string) => void;
  selectedIds: string[];
  transformMode: TransformMode;
  setTransformMode: (mode: TransformMode) => void;
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;
  settings: EnvironmentSettings;
  setSettings: React.Dispatch<React.SetStateAction<EnvironmentSettings>>;
  updateObjectColor: (id: string, slot: string, color: string) => void;
  updateObjectTexture: (id: string, url: string) => void;
  onAddCustomModel: (url: string, format: 'fbx' | 'glb' | 'gltf') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSaveFile: () => void;
  onLoadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAssetLibraryOpen: boolean;
  setIsAssetLibraryOpen: (open: boolean) => void;
  onAddObject: (type: ItemType) => void;
}

const COLOR_SLOTS: Record<ItemType, { key: string, label: string }[]> = {
    [ItemType.TABLE_SQUARE]: [{ key: 'top', label: 'Top' }, { key: 'legs', label: 'Legs' }],
    [ItemType.TABLE_ROUND]: [{ key: 'top', label: 'Top' }, { key: 'legs', label: 'Legs' }],
    [ItemType.COUNTER_STRAIGHT]: [{ key: 'body', label: 'Body' }, { key: 'top', label: 'Top' }, { key: 'detail', label: 'Detail' }],
    [ItemType.COUNTER_CORNER]: [{ key: 'body', label: 'Body' }, { key: 'top', label: 'Top' }],
    [ItemType.CHAIR]: [{ key: 'seat', label: 'Seat' }, { key: 'wood', label: 'Frame' }],
    [ItemType.STOVE]: [{ key: 'body', label: 'Body' }, { key: 'top', label: 'Top' }],
    [ItemType.SINK]: [{ key: 'body', label: 'Body' }, { key: 'top', label: 'Top' }, { key: 'basin', label: 'Basin' }],
    [ItemType.FRIDGE]: [{ key: 'body', label: 'Body' }, { key: 'handle', label: 'Handle' }],
    [ItemType.PLANT]: [{ key: 'pot', label: 'Pot' }],
    [ItemType.DECOR_PAN]: [{ key: 'pan', label: 'Metal' }],
    [ItemType.DECOR_BOARD]: [{ key: 'board', label: 'Wood' }],
    [ItemType.DECOR_FLAG]: [{ key: 'stripe1', label: 'Left' }, { key: 'stripe2', label: 'Middle' }, { key: 'stripe3', label: 'Right' }],
    [ItemType.DECOR_RUG]: [{ key: 'base', label: 'Base' }, { key: 'stripe1', label: 'P1' }, { key: 'stripe2', label: 'P2' }],
    [ItemType.WALL]: [{ key: 'paint', label: 'Paint' }],
    [ItemType.CUSTOM_MODEL]: [{ key: 'tint', label: 'Tint' }],
    // Food
    [ItemType.FOOD_TOMATO]: [{ key: 'skin', label: 'Skin' }, { key: 'stem', label: 'Stem' }],
    [ItemType.FOOD_CHEESE]: [{ key: 'cheese', label: 'Cheese' }],
    [ItemType.FOOD_PEPPERONI]: [{ key: 'meat', label: 'Meat' }],
    [ItemType.FOOD_WHEAT]: [{ key: 'stalk', label: 'Stalk' }, { key: 'grain', label: 'Grain' }, { key: 'tie', label: 'Tie' }],
    [ItemType.FOOD_MILK]: [{ key: 'box', label: 'Carton' }, { key: 'label', label: 'Label' }],
    [ItemType.FOOD_EGGPLANT]: [{ key: 'skin', label: 'Skin' }, { key: 'top', label: 'Top' }],
    [ItemType.FOOD_ZUCCHINI]: [{ key: 'skin', label: 'Skin' }]
};

const TEXTURE_PRESETS = [
    { name: 'Wood', url: 'https://picsum.photos/seed/wood/256/256' },
    { name: 'Marble', url: 'https://picsum.photos/seed/marble/256/256' },
    { name: 'Tiles', url: 'https://picsum.photos/seed/tiles/256/256' },
    { name: 'Metal', url: 'https://picsum.photos/seed/metal/256/256' },
];

export const Controls: React.FC<ControlsProps> = ({
  objects,
  onRemove,
  selectedIds,
  transformMode,
  setTransformMode,
  cameraMode,
  setCameraMode,
  settings,
  setSettings,
  updateObjectColor,
  updateObjectTexture,
  onAddCustomModel,
  onUndo, onRedo, canUndo, canRedo,
  onSaveFile, onLoadFile,
  isAssetLibraryOpen, setIsAssetLibraryOpen,
  onAddObject
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textureInputRef = useRef<HTMLInputElement>(null);
  const floorTexInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  
  const selectedCount = selectedIds.length;
  const singleSelectedObject = selectedCount === 1 ? objects.find(o => o.id === selectedIds[0]) : null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSettings(prev => ({ ...prev, referenceImage: url, referenceOpacity: 0.5 }));
    }
  };

  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && singleSelectedObject) {
          const url = URL.createObjectURL(file);
          updateObjectTexture(singleSelectedObject.id, url);
      }
  }

  const handleFloorTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setSettings(prev => ({ ...prev, floorTextureUrl: url }));
      }
  }

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          const url = URL.createObjectURL(file);
          const extension = file.name.split('.').pop()?.toLowerCase();
          const format = extension === 'fbx' ? 'fbx' : 'glb';
          onAddCustomModel(url, format);
      }
  }

  return (
    <>
        {/* Left Sidebar */}
        <div className="absolute top-0 left-0 h-full w-72 bg-gray-900 text-white shadow-xl overflow-y-auto p-4 border-r border-gray-700 custom-scrollbar z-20 flex flex-col gap-4">
        
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-teal-400">Kitchen Planner</h1>
            <div className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-400">v2.1</div>
        </div>

        {/* Action Bar */}
        <div className="grid grid-cols-4 gap-1 bg-gray-800 p-2 rounded-lg shadow-inner">
             <button onClick={onUndo} disabled={!canUndo} className="p-2 rounded hover:bg-gray-700 disabled:opacity-30 transition-all" title="Undo (Ctrl+Z)">
                <Undo2 size={18} />
             </button>
             <button onClick={onRedo} disabled={!canRedo} className="p-2 rounded hover:bg-gray-700 disabled:opacity-30 transition-all" title="Redo (Ctrl+Y)">
                <Redo2 size={18} />
             </button>
             <button onClick={onSaveFile} className="p-2 rounded hover:bg-gray-700 text-teal-400 transition-all" title="Save File">
                <Save size={18} />
             </button>
             <button onClick={() => jsonInputRef.current?.click()} className="p-2 rounded hover:bg-gray-700 text-amber-400 transition-all" title="Load File">
                <FolderOpen size={18} />
             </button>
             <input type="file" ref={jsonInputRef} onChange={onLoadFile} accept=".json" className="hidden" />
        </div>

        {/* Laptop Friendly Controls */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <h3 className="text-xs uppercase text-gray-500 font-bold mb-3 flex items-center gap-2">
                 <MousePointer2 size={12}/> View Controls
            </h3>
            <div className="flex gap-2 mb-3">
                <button
                    onClick={() => setCameraMode('orbit')}
                    className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-xs font-medium transition-all ${cameraMode === 'orbit' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                >
                    <Rotate3d size={14}/> Rotate
                </button>
                <button
                    onClick={() => setCameraMode('pan')}
                    className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-xs font-medium transition-all ${cameraMode === 'pan' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                >
                    <Hand size={14}/> Pan
                </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onPointerDown={() => window.dispatchEvent(new CustomEvent('camera-action', { detail: 'zoom-in' }))}
                    className="py-2 bg-gray-700 hover:bg-gray-600 rounded text-[10px] font-bold uppercase tracking-wider text-gray-300"
                >
                    Zoom In
                </button>
                <button 
                    onPointerDown={() => window.dispatchEvent(new CustomEvent('camera-action', { detail: 'zoom-out' }))}
                    className="py-2 bg-gray-700 hover:bg-gray-600 rounded text-[10px] font-bold uppercase tracking-wider text-gray-300"
                >
                    Zoom Out
                </button>
                <button 
                    onPointerDown={() => window.dispatchEvent(new CustomEvent('camera-action', { detail: 'rotate-left' }))}
                    className="py-2 bg-gray-700 hover:bg-gray-600 rounded text-[10px] font-bold uppercase tracking-wider text-gray-300"
                >
                    Rot Left
                </button>
                <button 
                    onPointerDown={() => window.dispatchEvent(new CustomEvent('camera-action', { detail: 'rotate-right' }))}
                    className="py-2 bg-gray-700 hover:bg-gray-600 rounded text-[10px] font-bold uppercase tracking-wider text-gray-300"
                >
                    Rot Right
                </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 italic text-center">Use buttons if you don't have a mouse</p>
        </div>

        {/* Transform Gizmos */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">Tools</h3>
            <div className="flex gap-2 mb-4">
            <button 
                onClick={() => setTransformMode('translate')}
                className={`flex-1 p-2 rounded flex justify-center transition-all ${transformMode === 'translate' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                title="Move"
            >
                <Move size={18} />
            </button>
            <button 
                onClick={() => setTransformMode('rotate')}
                className={`flex-1 p-2 rounded flex justify-center transition-all ${transformMode === 'rotate' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                title="Rotate"
            >
                <Rotate3d size={18} />
            </button>
            <button 
                onClick={() => setTransformMode('scale')}
                className={`flex-1 p-2 rounded flex justify-center transition-all ${transformMode === 'scale' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                title="Scale"
            >
                <Maximize size={18} />
            </button>
            </div>
            
            {selectedCount > 0 && (
                <div className="space-y-4 border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-teal-400 font-bold uppercase flex items-center gap-2">
                           <Layers size={14}/> {selectedCount} Selected
                        </span>
                        <button 
                            onClick={() => selectedIds.forEach(id => onRemove(id))}
                            className="p-1 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                            title="Delete Selected"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {/* Single Item Properties */}
                    {singleSelectedObject && (
                        <div className="space-y-4">
                            {/* Color Slots */}
                            {COLOR_SLOTS[singleSelectedObject.type] && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] text-gray-500 font-bold uppercase">Colors</h4>
                                    {COLOR_SLOTS[singleSelectedObject.type].map((slot) => (
                                        <div key={slot.key} className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-700/30">
                                            <span className="text-xs text-gray-300">{slot.label}</span>
                                            <input 
                                                type="color" 
                                                value={singleSelectedObject.customColors[slot.key] || '#ffffff'}
                                                onChange={(e) => updateObjectColor(singleSelectedObject.id, slot.key, e.target.value)}
                                                className="bg-transparent w-8 h-6 cursor-pointer border-none p-0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Texture Presets */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] text-gray-500 font-bold uppercase">Textures</h4>
                                <div className="grid grid-cols-4 gap-1">
                                    {TEXTURE_PRESETS.map(tex => (
                                        <button 
                                            key={tex.name}
                                            onClick={() => updateObjectTexture(singleSelectedObject.id, tex.url)}
                                            className="aspect-square bg-gray-700 rounded overflow-hidden border border-gray-600 hover:border-teal-500 transition-all"
                                            title={tex.name}
                                        >
                                            <img src={tex.url} alt={tex.name} className="w-full h-full object-cover opacity-60 hover:opacity-100" referrerPolicy="no-referrer" />
                                        </button>
                                    ))}
                                </div>
                                <input type="file" ref={textureInputRef} onChange={handleTextureUpload} accept="image/*" className="hidden" />
                                <button 
                                    onClick={() => textureInputRef.current?.click()}
                                    className="w-full py-2 text-[10px] bg-gray-700 text-gray-300 rounded hover:bg-gray-600 flex items-center justify-center gap-2 border border-dashed border-gray-500"
                                >
                                    <Upload size={12}/> Custom Texture
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Environment Settings */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">Environment</h3>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">Floor Color</label>
                    <input 
                        type="color" 
                        value={settings.floorColor}
                        onChange={(e) => setSettings({...settings, floorColor: e.target.value})}
                        className="bg-transparent w-8 h-6 cursor-pointer"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-gray-400 block">Reference Image</label>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 bg-gray-700 rounded hover:bg-gray-600 text-xs text-gray-300 flex items-center justify-center gap-2"
                    >
                        <ImageIcon size={14} /> {settings.referenceImage ? 'Change Image' : 'Upload Floor Plan'}
                    </button>
                    
                    {settings.referenceImage && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">Opacity</span>
                            <input 
                                type="range" min="0" max="1" step="0.05" 
                                value={settings.referenceOpacity}
                                onChange={(e) => setSettings({...settings, referenceOpacity: parseFloat(e.target.value)})}
                                className="flex-1 accent-teal-500 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    )}
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 pt-2">
                    <input 
                        type="checkbox" 
                        checked={settings.showGrid}
                        onChange={(e) => setSettings({...settings, showGrid: e.target.checked})}
                        className="rounded text-teal-500 bg-gray-700 border-gray-600"
                    />
                    Display Grid
                </label>
            </div>
        </div>

        <div className="mt-auto pt-4">
            <button 
                onClick={() => setIsAssetLibraryOpen(true)}
                className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border-b-4 border-teal-800"
            >
                <div className="flex items-center gap-2">
                    <LayoutGrid size={20} /> 
                    <span>ASSET LIBRARY</span>
                </div>
                <span className="text-[10px] opacity-60 font-normal">Press 'A' to toggle</span>
            </button>
        </div>
        
        </div>

        {/* Asset Library Overlay */}
        {isAssetLibraryOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
                <div className="bg-gray-900 w-full max-w-4xl h-full max-h-[80vh] rounded-2xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Box size={24} className="text-teal-400"/> 
                                Kitchen Assets
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">Click an item to add it to the scene</p>
                        </div>
                        <button 
                            onClick={() => setIsAssetLibraryOpen(false)} 
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-950/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             {/* Architecture */}
                            <AssetSection title="Architecture" color="text-amber-400">
                                <AssetItem type={ItemType.WALL} label="Wall Segment" onClick={onAddObject} />
                            </AssetSection>

                            {/* Furniture */}
                            <AssetSection title="Furniture" color="text-teal-400">
                                <AssetItem type={ItemType.TABLE_SQUARE} label="Dining Table" onClick={onAddObject} />
                                <AssetItem type={ItemType.CHAIR} label="Modern Chair" onClick={onAddObject} />
                                <AssetItem type={ItemType.COUNTER_STRAIGHT} label="Kitchen Counter" onClick={onAddObject} />
                                <AssetItem type={ItemType.COUNTER_CORNER} label="Corner Counter" onClick={onAddObject} />
                            </AssetSection>

                            {/* Appliances */}
                            <AssetSection title="Appliances" color="text-blue-400">
                                <AssetItem type={ItemType.STOVE} label="Gas Stove" onClick={onAddObject} />
                                <AssetItem type={ItemType.FRIDGE} label="Refrigerator" onClick={onAddObject} />
                                <AssetItem type={ItemType.SINK} label="Kitchen Sink" onClick={onAddObject} />
                            </AssetSection>

                            {/* Decoration */}
                            <AssetSection title="Decoration" color="text-purple-400">
                                <AssetItem type={ItemType.PLANT} label="Potted Plant" onClick={onAddObject} />
                                <AssetItem type={ItemType.DECOR_PAN} label="Frying Pan" onClick={onAddObject} />
                                <AssetItem type={ItemType.DECOR_BOARD} label="Cutting Board" onClick={onAddObject} />
                                <AssetItem type={ItemType.DECOR_FLAG} label="Papel Picado" onClick={onAddObject} />
                                <AssetItem type={ItemType.DECOR_RUG} label="Kitchen Rug" onClick={onAddObject} />
                            </AssetSection>

                            {/* Ingredients */}
                            <AssetSection title="Ingredients" color="text-red-400">
                                <AssetItem type={ItemType.FOOD_TOMATO} label="Tomato" onClick={onAddObject} />
                                <AssetItem type={ItemType.FOOD_CHEESE} label="Cheese Block" onClick={onAddObject} />
                                <AssetItem type={ItemType.FOOD_PEPPERONI} label="Pepperoni" onClick={onAddObject} />
                                <AssetItem type={ItemType.FOOD_WHEAT} label="Wheat Stalk" onClick={onAddObject} />
                                <AssetItem type={ItemType.FOOD_MILK} label="Milk Carton" onClick={onAddObject} />
                                <AssetItem type={ItemType.FOOD_EGGPLANT} label="Eggplant" onClick={onAddObject} />
                                <AssetItem type={ItemType.FOOD_ZUCCHINI} label="Zucchini" onClick={onAddObject} />
                            </AssetSection>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

const AssetSection = ({ title, color, children }: { title: string, color: string, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h3 className={`text-xs font-black ${color} uppercase tracking-[0.2em] border-b border-gray-800 pb-2`}>{title}</h3>
        <div className="grid grid-cols-2 gap-3">
            {children}
        </div>
    </div>
);

const AssetItem = ({ type, label, onClick }: { type: ItemType, label: string, onClick: (type: ItemType) => void }) => (
    <button 
        onClick={() => onClick(type)}
        className="group flex flex-col items-center gap-3 p-4 bg-gray-800/40 hover:bg-teal-900/20 border border-gray-700 hover:border-teal-500/50 rounded-xl transition-all duration-200"
    >
        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <Box size={24} className="text-gray-500 group-hover:text-teal-400 transition-colors" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-wider text-center">{label}</span>
    </button>
);
