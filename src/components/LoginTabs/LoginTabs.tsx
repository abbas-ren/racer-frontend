import React from 'react';
import styles from './LoginTabsStyles.module.scss';

export interface Tab {
  id: number;
  label: string;
}

interface TabsComponentProps {
  tabs: Tab[];
  setActiveTab: React.Dispatch<React.SetStateAction<number>>;
  activeTab: number;
}

const LoginTabs: React.FC<TabsComponentProps> = ({
  tabs,
  setActiveTab,
  activeTab,
}) => {
  const handleTabClick = (tabId: number) => {
    setActiveTab(tabId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabsWrapper}>
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => handleTabClick(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginTabs;
