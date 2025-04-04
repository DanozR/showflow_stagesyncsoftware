import React, { useState, useEffect } from 'react';
import { Student, DanceClass, Conflict, ShowInfo } from './types';
import FileUpload from './components/FileUpload';
import ClassList from './components/ClassList';
import ShowOrder from './components/ShowOrder';
import ConflictList from './components/ConflictList';
import StudentList from './components/StudentList';
import ExportButtons from './components/ExportButtons';
import ShowInfoForm from './components/ShowInfoForm';
import { buildClassesFromStudents } from './utils/showOptimizer';
import { optimizeShowOrder, terminateWorker } from './utils/optimizerService';
import { Music, Users, AlertTriangle, List, RefreshCw, Info } from 'lucide-react';

function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<DanceClass[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [minGap, setMinGap] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'conflicts'>('classes');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [showInfoOpen, setShowInfoOpen] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<ShowInfo>({
    name: 'Dance Recital',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    location: 'Main Auditorium'
  });

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      terminateWorker();
    };
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      const newClasses = buildClassesFromStudents(students);
      setClasses(newClasses);
    }
  }, [students]);

  useEffect(() => {
    if (classes.length > 0) {
      setIsOptimizing(true);
      
      // Only optimize classes that are included in the show
      const includedClasses = classes.filter(c => c.included);
      
      // Use the worker to optimize
      optimizeShowOrder(includedClasses, minGap)
        .then(({ orderedClasses, conflicts }) => {
          // Update only the included classes with their new positions
          setClasses(prevClasses => {
            return prevClasses.map(c => {
              if (!c.included) return c;
              
              // Find the corresponding class in orderedClasses
              const orderedClass = orderedClasses.find(oc => oc.name === c.name);
              if (orderedClass) {
                return {
                  ...c,
                  position: orderedClass.position,
                  locked: c.locked // Preserve locked state
                };
              }
              return c;
            });
          });
          
          setConflicts(conflicts);
          setIsOptimizing(false);
        })
        .catch(error => {
          console.error("Optimization error:", error);
          setIsOptimizing(false);
        });
    }
  }, [minGap]);

  const handleStudentsLoaded = (loadedStudents: Student[]) => {
    setStudents(loadedStudents);
  };

  const handleDuplicateClass = (className: string) => {
    setClasses(prevClasses => {
      // Find the class to duplicate
      const originalClass = prevClasses.find(c => c.name === className);
      if (!originalClass) return prevClasses;
      
      // Create a copy with a new name
      let newName = `${originalClass.name} (Copy)`;
      let counter = 1;
      
      // Make sure the new name is unique
      while (prevClasses.some(c => c.name === newName)) {
        counter++;
        newName = `${originalClass.name} (Copy ${counter})`;
      }
      
      const duplicatedClass: DanceClass = {
        ...originalClass,
        name: newName,
        position: null, // Reset position
        locked: false,  // Reset locked state
        included: true,  // Include by default
        title: originalClass.title || '' // Copy the title if it exists
      };
      
      // Add the new class to the array
      return [...prevClasses, duplicatedClass];
    });
    
    // Trigger optimization after state update
    setTimeout(() => {
      setIsOptimizing(true);
      
      // Get the latest classes after state update
      setClasses(prevClasses => {
        // Get all included classes
        const includedClasses = prevClasses.filter(c => c.included);
        
        // Run optimization
        optimizeShowOrder(includedClasses, minGap)
          .then(({ orderedClasses, conflicts }) => {
            // Update only the included classes with their new positions
            setClasses(latestClasses => {
              return latestClasses.map(c => {
                if (!c.included) return c;
                
                // Find the corresponding class in orderedClasses
                const orderedClass = orderedClasses.find(oc => oc.name === c.name);
                if (orderedClass) {
                  return {
                    ...c,
                    position: orderedClass.position,
                    locked: c.locked // Preserve locked state
                  };
                }
                return c;
              });
            });
            
            setConflicts(conflicts);
            setIsOptimizing(false);
          })
          .catch(error => {
            console.error("Optimization error:", error);
            setIsOptimizing(false);
          });
        
        return prevClasses;
      });
    }, 0);
  };

  const handleDeleteClass = (className: string) => {
    setClasses(prevClasses => {
      // Remove the class
      return prevClasses.filter(c => c.name !== className);
    });
    
    // Trigger optimization after state update
    setTimeout(() => {
      setIsOptimizing(true);
      
      // Get the latest classes after state update
      setClasses(prevClasses => {
        // Get all included classes
        const includedClasses = prevClasses.filter(c => c.included);
        
        // Run optimization
        optimizeShowOrder(includedClasses, minGap)
          .then(({ orderedClasses, conflicts }) => {
            // Update only the included classes with their new positions
            setClasses(latestClasses => {
              return latestClasses.map(c => {
                if (!c.included) return c;
                
                // Find the corresponding class in orderedClasses
                const orderedClass = orderedClasses.find(oc => oc.name === c.name);
                if (orderedClass) {
                  return {
                    ...c,
                    position: orderedClass.position,
                    locked: c.locked // Preserve locked state
                  };
                }
                return c;
              });
            });
            
            setConflicts(conflicts);
            setIsOptimizing(false);
          })
          .catch(error => {
            console.error("Optimization error:", error);
            setIsOptimizing(false);
          });
        
        return prevClasses;
      });
    }, 0);
  };

  const handleToggleIncluded = (className: string) => {
    // First, update the class's included state without running optimization
    setClasses(prevClasses => {
      return prevClasses.map(c => 
        c.name === className ? { ...c, included: !c.included } : c
      );
    });
    
    // Then run optimization in a separate step
    setTimeout(() => {
      setIsOptimizing(true);
      
      // Get the latest classes after state update
      setClasses(prevClasses => {
        // Find the class we just toggled
        const toggledClass = prevClasses.find(c => c.name === className);
        if (!toggledClass) return prevClasses;
        
        // Get all included classes
        const includedClasses = prevClasses.filter(c => c.included);
        
        // If we're adding a class back to the show, make sure it gets a position
        if (toggledClass.included && toggledClass.position === null) {
          // Assign a default position at the end
          const updatedClasses = prevClasses.map(c => {
            if (c.name === className) {
              return {
                ...c,
                position: includedClasses.length - 1,
                locked: false
              };
            }
            return c;
          });
          
          // Only optimize if we're adding a class (not removing)
          optimizeShowOrder(updatedClasses.filter(c => c.included), minGap)
            .then(({ orderedClasses, conflicts }) => {
              // Update only the included classes with their new positions
              setClasses(latestClasses => {
                return latestClasses.map(c => {
                  if (!c.included) return c;
                  
                  // Find the corresponding class in orderedClasses
                  const orderedClass = orderedClasses.find(oc => oc.name === c.name);
                  if (orderedClass) {
                    return {
                      ...c,
                      position: orderedClass.position,
                      locked: c.locked // Preserve locked state
                    };
                  }
                  return c;
                });
              });
              
              setConflicts(conflicts);
              setIsOptimizing(false);
            })
            .catch(error => {
              console.error("Optimization error:", error);
              setIsOptimizing(false);
            });
          
          return updatedClasses;
        } else if (!toggledClass.included) {
          // If we're removing a class, just recalculate conflicts
          const remainingIncludedClasses = prevClasses.filter(c => c.included);
          
          optimizeShowOrder(remainingIncludedClasses, minGap)
            .then(({ conflicts }) => {
              setConflicts(conflicts);
              setIsOptimizing(false);
            })
            .catch(error => {
              console.error("Conflict detection error:", error);
              setIsOptimizing(false);
            });
        }
        
        return prevClasses;
      });
    }, 0);
  };

  const handleToggleLocked = (className: string) => {
    // First, update the locked state without running optimization
    setClasses(prevClasses => {
      // Find the class we want to toggle
      const classToToggle = prevClasses.find(c => c.name === className);
      if (!classToToggle) return prevClasses;
      
      // Create a new array with the toggled class
      return prevClasses.map(c => 
        c.name === className ? { ...c, locked: !c.locked } : c
      );
    });
    
    // Then run optimization in a separate step, but only to recalculate conflicts
    setTimeout(() => {
      setIsOptimizing(true);
      
      setClasses(prevClasses => {
        // Get all included classes
        const includedClasses = prevClasses.filter(c => c.included);
        
        // Run optimization only to recalculate conflicts
        // We won't update any positions, just get the conflicts
        optimizeShowOrder(includedClasses, minGap)
          .then(({ conflicts }) => {
            setConflicts(conflicts);
            setIsOptimizing(false);
          })
          .catch(error => {
            console.error("Conflict detection error:", error);
            setIsOptimizing(false);
          });
        
        return prevClasses;
      });
    }, 0);
  };

  const handleUpdatePosition = (className: string, newPosition: number) => {
    setClasses(prevClasses => {
      // Get only included classes
      const includedClasses = prevClasses.filter(c => c.included);
      
      // Validate position is within range
      if (newPosition < 1 || newPosition > includedClasses.length) {
        return prevClasses;
      }
      
      // Convert from 1-based UI position to 0-based internal position
      const targetPosition = newPosition - 1;
      
      // Find the class to move
      const classIndex = prevClasses.findIndex(c => c.name === className);
      if (classIndex === -1) return prevClasses;
      
      const classToMove = { ...prevClasses[classIndex] };
      const currentPosition = classToMove.position;
      
      // If position is the same, no need to change
      if (currentPosition === targetPosition) return prevClasses;
      
      // Create a copy of classes
      const updatedClasses = [...prevClasses];
      
      // Update the position and lock the class
      updatedClasses[classIndex] = {
        ...classToMove,
        position: targetPosition,
        locked: true // Always lock when manually positioning
      };
      
      // Manually reorder the classes to avoid duplicates
      // First, get all included classes except the one being moved
      const otherIncludedClasses = updatedClasses
        .filter(c => c.included && c.name !== className)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Insert the moved class at the target position
      otherIncludedClasses.splice(targetPosition, 0, updatedClasses[classIndex]);
      
      // Reassign positions to all included classes
      otherIncludedClasses.forEach((c, idx) => {
        const classIdx = updatedClasses.findIndex(uc => uc.name === c.name);
        if (classIdx !== -1) {
          updatedClasses[classIdx] = {
            ...updatedClasses[classIdx],
            position: idx
          };
        }
      });
      
      return updatedClasses;
    });
    
    // Recalculate conflicts after position update
    setTimeout(() => {
      setIsOptimizing(true);
      
      // Get the latest classes after state update
      setClasses(prevClasses => {
        // Get all included classes
        const includedClasses = prevClasses.filter(c => c.included);
        
        // Run optimization to recalculate conflicts
        optimizeShowOrder(includedClasses, minGap)
          .then(({ conflicts }) => {
            setConflicts(conflicts);
            setIsOptimizing(false);
          })
          .catch(error => {
            console.error("Conflict detection error:", error);
            setIsOptimizing(false);
          });
        
        return prevClasses;
      });
    }, 0);
  };

  const handleUpdateTitle = (className: string, newTitle: string) => {
    setClasses(prevClasses => {
      return prevClasses.map(c => 
        c.name === className ? { ...c, title: newTitle } : c
      );
    });
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    
    // Use setTimeout to allow the UI to update before starting the optimization
    setTimeout(() => {
      // Reset all non-locked positions for included classes
      setClasses(prevClasses => {
        const resetClasses = prevClasses.map(c => 
          !c.included ? c : (c.locked ? c : { ...c, position: null })
        );
        
        // Only optimize classes that are included in the show
        const includedClasses = resetClasses.filter(c => c.included);
        
        optimizeShowOrder(includedClasses, minGap)
          .then(({ orderedClasses, conflicts }) => {
            // Update only the included classes with their new positions
            setClasses(latestClasses => {
              return latestClasses.map(c => {
                if (!c.included) return c;
                
                // If the class is locked, preserve its position
                if (c.locked) return c;
                
                // Find the corresponding class in orderedClasses
                const orderedClass = orderedClasses.find(oc => oc.name === c.name);
                if (orderedClass) {
                  return {
                    ...c,
                    position: orderedClass.position
                  };
                }
                return c;
              });
            });
            
            setConflicts(conflicts);
            setIsOptimizing(false);
          })
          .catch(error => {
            console.error("Optimization error:", error);
            setIsOptimizing(false);
          });
        
        return resetClasses;
      });
    }, 100);
  };

  const handleShowInfoUpdate = (newInfo: ShowInfo) => {
    setShowInfo(newInfo);
    setShowInfoOpen(false);
  };

  // Calculate class statistics
  const classStats = {
    total: classes.length,
    inShow: classes.filter(c => c.included).length,
    notInShow: classes.filter(c => !c.included).length,
    locked: classes.filter(c => c.included && c.locked).length
  };

  // Calculate conflict statistics
  const conflictStats = {
    total: conflicts.length,
    backToBack: conflicts.filter(c => c.gap === 0).length,
    byGap: Array.from({ length: minGap }, (_, i) => ({
      gap: i,
      count: conflicts.filter(c => c.gap === i).length
    }))
  };

  // Get included classes for passing to ConflictList
  const includedClasses = classes.filter(c => c.included);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4">
            {/* Logo */}
            <div className="flex items-center justify-between">
              <img 
                src="https://i.imgur.com/o5iWGOq.png" 
                alt="ShowFlow" 
                className="h-20"
              />
              <button
                onClick={() => setShowInfoOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-charcoal bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral"
              >
                <Info className="h-4 w-4 mr-1" />
                Edit Show Info
              </button>
            </div>
            
            {/* Show info */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-2xl font-semibold text-charcoal">{showInfo.name}</h2>
              <div className="mt-1 text-sm text-gray-600">
                {showInfo.date && new Date(showInfo.date).toLocaleDateString()} {showInfo.time && `at ${showInfo.time}`}
                {showInfo.location && ` • ${showInfo.location}`}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {students.length === 0 ? (
          <div className="mt-8">
            <FileUpload onStudentsLoaded={handleStudentsLoaded} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-charcoal">Settings</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleOptimize}
                      disabled={isOptimizing}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                        isOptimizing 
                          ? 'bg-coral/60 cursor-not-allowed' 
                          : 'bg-coral hover:bg-coral/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral'
                      }`}
                    >
                      {isOptimizing ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full"></div>
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Re-optimize
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="minGap" className="block text-sm font-medium text-charcoal mb-1">
                    Minimum gap between performer appearances: {minGap}
                  </label>
                  <input
                    id="minGap"
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={minGap}
                    onChange={(e) => setMinGap(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
                
                {conflicts.length > 0 && (
                  <div className="mb-4 p-3 bg-coral/10 border border-coral/20 rounded-md">
                    <h3 className="text-sm font-medium text-charcoal mb-1">Conflict Summary:</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-coral/20 text-charcoal">
                        Total: {conflictStats.total}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        conflictStats.backToBack > 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        Back-to-back: {conflictStats.backToBack}
                      </span>
                      {conflictStats.byGap.filter(s => s.gap > 0).map(stat => (
                        <span 
                          key={stat.gap} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-coral/20 text-charcoal"
                        >
                          {stat.gap} gap: {stat.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {students.length > 0 && classes.length > 0 && (
                  <div className="mb-4">
                    <ExportButtons 
                      classes={classes}
                      students={students}
                      conflicts={conflicts}
                      minGap={minGap}
                      showInfo={showInfo}
                      showInSettings={true}
                    />
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex space-x-1 border-b border-gray-200">
                    <button
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'classes'
                          ? 'border-b-2 border-coral text-coral'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('classes')}
                    >
                      <div className="flex items-center">
                        <Music className="h-4 w-4 mr-1" />
                        Classes
                      </div>
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'students'
                          ? 'border-b-2 border-coral text-coral'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('students')}
                    >
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Performers
                      </div>
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'conflicts'
                          ? 'border-b-2 border-coral text-coral'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('conflicts')}
                    >
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Conflicts {conflicts.length > 0 && `(${conflicts.length})`}
                      </div>
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    {activeTab === 'classes' && (
                      <>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-charcoal">
                            Total: {classStats.total}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            In Show: {classStats.inShow}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-coral/20 text-charcoal">
                            Not in Show: {classStats.notInShow}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-taupe/20 text-charcoal">
                            Locked: {classStats.locked}
                          </span>
                        </div>
                        <ClassList
                          classes={classes}
                          onToggleIncluded={handleToggleIncluded}
                          onDuplicateClass={handleDuplicateClass}
                          onDeleteClass={handleDeleteClass}
                          onUpdateTitle={handleUpdateTitle}
                          conflicts={conflicts}
                        />
                      </>
                    )}
                    {activeTab === 'students' && (
                      <StudentList students={students} />
                    )}
                    {activeTab === 'conflicts' && (
                      <ConflictList
                        conflicts={conflicts}
                        minGap={minGap}
                        classes={includedClasses}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <List className="h-5 w-5 text-gray-500 mr-2" />
                    <h2 className="text-lg font-medium text-charcoal">Show Order</h2>
                  </div>
                  {students.length > 0 && classes.length > 0 && (
                    <ExportButtons 
                      classes={classes}
                      students={students}
                      conflicts={conflicts}
                      minGap={minGap}
                      showInfo={showInfo}
                      showInSettings={false}
                    />
                  )}
                </div>
                <ShowOrder 
                  classes={classes.filter(c => c.included)} 
                  onToggleLocked={handleToggleLocked}
                  onUpdatePosition={handleUpdatePosition}
                  onUpdateTitle={handleUpdateTitle}
                  conflicts={conflicts}
                />
              </div>
              
              {conflicts.length > 0 && (
                <div className="mt-6">
                  <ConflictList 
                    conflicts={conflicts} 
                    minGap={minGap} 
                    classes={includedClasses}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {showInfoOpen && (
        <ShowInfoForm
          showInfo={showInfo}
          onSave={handleShowInfoUpdate}
          onCancel={() => setShowInfoOpen(false)}
        />
      )}
    </div>
  );
}

export default App;