import { useState, ReactNode } from "react";

interface TabsProps {
  children: ReactNode;
}

interface TabProps {
  name: string;
  children: ReactNode;
}

export function Tabs({ children }: TabsProps) {
  const childrenArray = Array.isArray(children) ? children : [children];
  const tabs = childrenArray.filter((child) => 
    child && typeof child === "object" && "props" in child && child.props.name
  ) as Array<{ props: TabProps }>;
  
  const [activeTab, setActiveTab] = useState(tabs[0]?.props.name || "");
  
  return (
    <div className="w-full">
      <div className="flex border-b border-slate-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.props.name}
            type="button"
            onClick={() => setActiveTab(tab.props.name)}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.props.name
                ? "text-sky-400 border-b-2 border-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.props.name}
          </button>
        ))}
      </div>
      
      <div className="mt-4">
        {tabs.find((tab) => tab.props.name === activeTab)?.props.children}
      </div>
    </div>
  );
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

