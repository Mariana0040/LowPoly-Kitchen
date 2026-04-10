
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { SceneObject, TransformMode, ItemType, EnvironmentSettings, CameraMode } from '../types';
import { 
    TableSquare, CounterStraight, CounterCorner, Chair, Stove, 
    DecorPan, Plant, DecorBoard, Fridge, Sink, DecorFlag, DecorRug,
    FoodTomato, FoodCheese, FoodPepperoni, FoodWheat, FoodMilk, FoodEggplant, FoodZucchini,
    Wall, CustomModel
} from './Prefabs';

interface SceneProps {
  objects: SceneObject[];
  selectedIds: string[];
  onSelect: (id: string | null, multi: boolean) => void;
  onTransform: (id: string, newProps: Partial<SceneObject>) => void;
  // Handler for group transform:
  onGroupTransform: (changes: {id: string, changes: Partial<SceneObject>}[]) => void;
  transformMode: TransformMode;
  cameraMode: CameraMode;
  settings: EnvironmentSettings;
  onDropObject: (type: ItemType, position: [number, number, number]) => void;
}

interface DraggableObjectProps { 
  obj: SceneObject; 
  isSelected: boolean; 
  isMultiSelected: boolean;
  onSelect: (multi: boolean) => void;
  onTransform: (props: Partial<SceneObject>) => void;
  mode: TransformMode;
}

const DraggableObject: React.FC<DraggableObjectProps> = ({ 
  obj, 
  isSelected,
  isMultiSelected,
  onSelect, 
  onTransform, 
  mode 
}) => {
  const objectRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (objectRef.current) {
        objectRef.current.position.set(...obj.position);
        objectRef.current.rotation.set(...obj.rotation);
        objectRef.current.scale.set(...obj.scale);
    }
  }, [obj.position, obj.rotation, obj.scale]);

  const getComponent = () => {
    switch (obj.type) {
      case ItemType.TABLE_SQUARE: return <TableSquare customColors={obj.customColors} />;
      case ItemType.COUNTER_STRAIGHT: return <CounterStraight customColors={obj.customColors} />;
      case ItemType.COUNTER_CORNER: return <CounterCorner customColors={obj.customColors} />;
      case ItemType.CHAIR: return <Chair customColors={obj.customColors} />;
      case ItemType.STOVE: return <Stove customColors={obj.customColors} />;
      case ItemType.FRIDGE: return <Fridge customColors={obj.customColors} />;
      case ItemType.SINK: return <Sink customColors={obj.customColors} />;
      case ItemType.DECOR_PAN: return <DecorPan customColors={obj.customColors} />;
      case ItemType.PLANT: return <Plant customColors={obj.customColors} />;
      case ItemType.DECOR_BOARD: return <DecorBoard customColors={obj.customColors} />;
      case ItemType.DECOR_FLAG: return <DecorFlag customColors={obj.customColors} />;
      case ItemType.DECOR_RUG: return <DecorRug customColors={obj.customColors} />;
      case ItemType.WALL: return <Wall customColors={obj.customColors} textureUrl={obj.textureUrl} scale={obj.scale} />;
      case ItemType.CUSTOM_MODEL: return <CustomModel modelUrl={obj.modelUrl} modelFormat={obj.modelFormat} customColors={obj.customColors} />;
      
      // Food
      case ItemType.FOOD_TOMATO: return <FoodTomato customColors={obj.customColors} />;
      case ItemType.FOOD_CHEESE: return <FoodCheese customColors={obj.customColors} />;
      case ItemType.FOOD_PEPPERONI: return <FoodPepperoni customColors={obj.customColors} />;
      case ItemType.FOOD_WHEAT: return <FoodWheat customColors={obj.customColors} />;
      case ItemType.FOOD_MILK: return <FoodMilk customColors={obj.customColors} />;
      case ItemType.FOOD_EGGPLANT: return <FoodEggplant customColors={obj.customColors} />;
      case ItemType.FOOD_ZUCCHINI: return <FoodZucchini customColors={obj.customColors} />;

      default: return <mesh><boxGeometry /><meshStandardMaterial color="hotpink" /></mesh>;
    }
  };

  return (
    <>
      <group 
        ref={objectRef} 
        onClick={(e) => { 
            e.stopPropagation(); 
            onSelect(e.shiftKey); 
        }}
      >
        {getComponent()}
        {/* Selection Highlight */}
        {isSelected && (
             <mesh>
                <boxGeometry args={[1.2, 1.2, 1.2]} />
                <meshBasicMaterial color="#4fd1c5" wireframe wireframeLinewidth={2} opacity={0.5} transparent />
             </mesh>
        )}
      </group>

      {/* 
        Single Object Controls 
        Only show if strictly this object is selected AND not part of a multi-selection group
      */}
      {isSelected && !isMultiSelected && (
        <TransformControls
          object={objectRef}
          mode={mode}
          size={1.2}
          onMouseUp={() => {
             if (objectRef.current) {
               const o = objectRef.current;
               onTransform({
                 position: [o.position.x, o.position.y, o.position.z],
                 rotation: [o.rotation.x, o.rotation.y, o.rotation.z],
                 scale: [o.scale.x, o.scale.y, o.scale.z]
               });
             }
          }}
        />
      )}
    </>
  );
};

// --- Group Control System ---

const GroupTransformGizmo = ({ 
    selectedObjects, 
    mode, 
    onGroupTransform 
}: { 
    selectedObjects: SceneObject[], 
    mode: TransformMode,
    onGroupTransform: (changes: {id: string, changes: Partial<SceneObject>}[]) => void
}) => {
    const groupRef = useRef<THREE.Mesh>(null);
    const startPositions = useRef<Map<string, THREE.Vector3>>(new Map());
    const startRotations = useRef<Map<string, THREE.Euler>>(new Map());
    
    // Calculate Centroid
    const centroid = new THREE.Vector3();
    if(selectedObjects.length > 0) {
        selectedObjects.forEach(obj => {
            centroid.add(new THREE.Vector3(...obj.position));
        });
        centroid.divideScalar(selectedObjects.length);
    }

    useEffect(() => {
        if(groupRef.current) {
            groupRef.current.position.copy(centroid);
            // Reset rotation/scale of the gizmo anchor
            groupRef.current.rotation.set(0,0,0);
            groupRef.current.scale.set(1,1,1);
        }
    }, [selectedObjects.length, mode]); // Re-center on selection change

    return (
        <>
            <mesh ref={groupRef} visible={false}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
            </mesh>
            <TransformControls 
                object={groupRef} 
                mode={mode} 
                size={1.2}
                onMouseDown={() => {
                    // Snapshot starting states
                    startPositions.current.clear();
                    startRotations.current.clear();
                    selectedObjects.forEach(obj => {
                        startPositions.current.set(obj.id, new THREE.Vector3(...obj.position));
                        startRotations.current.set(obj.id, new THREE.Euler(...obj.rotation));
                    });
                }}
                onMouseUp={() => {
                    if(!groupRef.current) return;
                    
                    const groupPos = groupRef.current.position;
                    // Calculate delta from original centroid
                    const delta = groupPos.clone().sub(centroid);
                    
                    const changes: {id: string, changes: Partial<SceneObject>}[] = selectedObjects.map(obj => {
                        const originalPos = startPositions.current.get(obj.id);
                        if (!originalPos) return { id: obj.id, changes: {} };

                        const newPos = originalPos.clone().add(delta);
                        
                        return {
                            id: obj.id,
                            changes: {
                                position: [newPos.x, newPos.y, newPos.z] as [number, number, number]
                            }
                        };
                    });
                    
                    onGroupTransform(changes);
                }}
            />
        </>
    );
}


const ReferencePlane = ({ settings }: { settings: EnvironmentSettings }) => {
    const texture = useLoader(THREE.TextureLoader, settings.referenceImage || 'https://picsum.photos/1024/768');

    if (!settings.referenceImage) return null;

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshBasicMaterial 
                map={texture} 
                transparent 
                opacity={settings.referenceOpacity} 
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
};

const Floor = ({ settings, onSelect }: { settings: EnvironmentSettings, onSelect: () => void }) => {
    const texture = settings.floorTextureUrl ? useLoader(THREE.TextureLoader, settings.floorTextureUrl) : null;
    if(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(25, 25);
    }

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow onClick={() => onSelect()}>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color={settings.floorColor} map={texture || null} />
        </mesh>
    );
}

const DropHandler = ({ onDropObject }: { onDropObject: (type: ItemType, pos: [number, number, number]) => void }) => {
    const { camera, gl } = useThree();
    const planeRef = useRef<THREE.Mesh>(null);

    useEffect(() => {
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'copy';
        };

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            const type = e.dataTransfer!.getData('application/react-dnd-item-type') as ItemType;
            
            if (type && planeRef.current) {
                const rect = gl.domElement.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
                
                const intersects = raycaster.intersectObject(planeRef.current);
                
                if (intersects.length > 0) {
                    const point = intersects[0].point;
                    onDropObject(type, [point.x, 0, point.z]);
                }
            }
        };

        const canvas = gl.domElement;
        canvas.addEventListener('dragover', handleDragOver);
        canvas.addEventListener('drop', handleDrop);

        return () => {
            canvas.removeEventListener('dragover', handleDragOver);
            canvas.removeEventListener('drop', handleDrop);
        };
    }, [camera, gl, onDropObject]);

    return (
        <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <planeGeometry args={[100, 100]} />
        </mesh>
    );
};

export const Scene: React.FC<SceneProps> = ({ 
    objects, selectedIds, onSelect, onTransform, onGroupTransform, transformMode, cameraMode, settings, onDropObject 
}) => {
  
  const selectedObjects = objects.filter(o => selectedIds.includes(o.id));
  const isMultiSelection = selectedObjects.length > 1;
  const controlsRef = useRef<any>(null);
  const activeActions = useRef<Set<string>>(new Set());

  useEffect(() => {
      const handleAction = (e: any) => {
          activeActions.current.add(e.detail);
          
          const stopAction = () => {
              activeActions.current.delete(e.detail);
              window.removeEventListener('pointerup', stopAction);
          };
          window.addEventListener('pointerup', stopAction);
      };

      window.addEventListener('camera-action' as any, handleAction);
      return () => window.removeEventListener('camera-action' as any, handleAction);
  }, []);

  return (
    <Canvas shadows camera={{ position: [5, 8, 8], fov: 45 }}>
      <CameraController controlsRef={controlsRef} activeActions={activeActions} />
      <color attach="background" args={['#1e1e1e']} />
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 15, 10]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-bias={-0.001}
      />
      <Environment preset="city" />

      <DropHandler onDropObject={onDropObject} />

      <Floor settings={settings} onSelect={() => onSelect(null, false)} />

      {/* Reference Image Overlay */}
      {settings.referenceImage && (
          <React.Suspense fallback={null}>
              <ReferencePlane settings={settings} />
          </React.Suspense>
      )}

      {settings.showGrid && <Grid infiniteGrid fadeDistance={50} sectionColor="#4a4a4a" cellColor="#2a2a2a" />}

      {/* Objects */}
      {objects.map((obj) => (
        <DraggableObject
          key={obj.id}
          obj={obj}
          isSelected={selectedIds.includes(obj.id)}
          isMultiSelected={isMultiSelection}
          onSelect={(multi) => onSelect(obj.id, multi)}
          onTransform={(props) => onTransform(obj.id, props)}
          mode={transformMode}
        />
      ))}
      
      {/* Group Gizmo for Multi-Selection */}
      {isMultiSelection && (
          <GroupTransformGizmo 
             selectedObjects={selectedObjects} 
             mode={transformMode}
             onGroupTransform={onGroupTransform}
          />
      )}

      <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.4} far={10} color="#000000" />
      
      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        enableDamping={true}
        dampingFactor={0.05}
        listenToKeyEvents={window}
        keys={{
            LEFT: 'ArrowLeft',
            RIGHT: 'ArrowRight',
            UP: 'ArrowUp',
            BOTTOM: 'ArrowDown'
        }}
        mouseButtons={{
            LEFT: cameraMode === 'orbit' ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        }}
        touches={{
            ONE: cameraMode === 'orbit' ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN,
            TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />
    </Canvas>
  );
};

const CameraController = ({ controlsRef, activeActions }: { controlsRef: any, activeActions: React.MutableRefObject<Set<string>> }) => {
    const { camera } = useThree();
    
    useFrame((state, delta) => {
        if (!controlsRef.current) return;
        const controls = controlsRef.current;
        const speed = 5 * delta;
        const rotSpeed = 2 * delta;

        if (activeActions.current.has('zoom-in')) {
            camera.position.lerp(controls.target, 0.05);
        }
        if (activeActions.current.has('zoom-out')) {
            const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
            camera.position.addScaledVector(dir, speed);
        }
        if (activeActions.current.has('rotate-left')) {
            controls.azimuthAngle -= rotSpeed;
        }
        if (activeActions.current.has('rotate-right')) {
            controls.azimuthAngle += rotSpeed;
        }
        
        controls.update();
    });

    return null;
}
