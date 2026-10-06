import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  CheckboxProps,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import styles from './TabBar.module.scss';

interface TabItem {
  label: string;
  value: string;
}

interface TabBarProps {
  tabs: TabItem[];
  onChange?: (value: string) => void;
  initialValue?: string;
  checkBoxProps?: CheckboxProps;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  onChange,
  initialValue,
  checkBoxProps,
}) => {
  const [selected, setSelected] = useState(
    initialValue || tabs[0]?.value || '',
  );

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setSelected(newValue);
    onChange?.(newValue);
  };

  return (
    <Stack
      className={styles.tabContainer}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Box className={styles.tabWrapper}>
        <Tabs value={selected} onChange={handleChange}>
          {tabs.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>
      </Box>
      <Stack direction="row" alignItems="center" gap="6px" paddingX="6px">
        <Checkbox {...checkBoxProps} />
        <Typography variant="body3" noWrap>
          Show Failed Only
        </Typography>
      </Stack>
    </Stack>
  );
};

export default TabBar;
