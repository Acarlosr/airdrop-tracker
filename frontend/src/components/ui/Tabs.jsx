import React, { createContext, useContext } from 'react';

const TabsContext = createContext({ value: '', onValueChange: () => { } });

export function Tabs({ value, onValueChange, children }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '' }) {
  const { value, onValueChange } = useContext(TabsContext);
  return (
    <div className={`flex rounded-lg bg-white/5 border border-white/10 p-1 gap-1 ${className}`}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && child.props.value != null
          ? React.cloneElement(child, {
            active: value === child.props.value,
            onSelect: () => onValueChange(child.props.value),
          })
          : child
      )}
    </div>
  );
}

export function TabsTrigger({ active, onSelect, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-electric/20 text-electric border border-electric/30' : 'text-white/70 hover:text-white hover:bg-white/5'
        } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }) {
  const { value: activeValue } = useContext(TabsContext);
  if (activeValue !== value) return null;
  return <div className={className}>{children}</div>;
}
