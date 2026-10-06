import { memo } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import type { ConfigurationStat } from 'types/configuration';
import styles from './ConfigurationStatsCards.module.scss';

interface ConfigurationStatsCardsProps {
  stats: ConfigurationStat[];
}

const ConfigurationStatsCards = ({ stats }: ConfigurationStatsCardsProps) => {
  return (
    <Stack className={styles.statsGrid}>
      {stats.map((stat) => (
        <Card key={stat.label} className={styles.statsCard}>
          <CardContent className={styles.cardContent}>
            <div className={styles.cardRow}>
              <Box>
                <Typography variant="label1" className={styles.statLabel}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" className={styles.statValue}>
                  {stat.value}
                </Typography>
              </Box>

              <Box
                className={styles.iconCircle}
                style={{ background: stat.iconBg }}
              >
                <CustomIcon name={stat.iconName} size={23} color="#ffffff" />
              </Box>
            </div>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default memo(ConfigurationStatsCards);
