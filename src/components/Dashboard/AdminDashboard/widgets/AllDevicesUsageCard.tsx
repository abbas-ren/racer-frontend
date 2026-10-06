import { Dispatch, SetStateAction } from 'react';
import {
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import CardHeader from './CardHeader';
import UsageChartTooltip from './UsageChartTooltip';
import { UsageDataItem } from '../types';
import { composeDashboardClasses } from '../styles/dashboardStyles';

interface AllDevicesUsageCardProps {
  usageTimeframe: 'weekly' | 'monthly';
  setUsageTimeframe: Dispatch<SetStateAction<'weekly' | 'monthly'>>;
  currentChartData: UsageDataItem[];
}

const isEmptyUsagePoint = ({ idle, utilized, devices }: UsageDataItem) =>
  idle === 0 && utilized === 0 && devices === 0;

const getUsageLabelValue = (
  dataKey: 'idle' | 'utilized' | 'devices',
  entry?: UsageDataItem,
) => {
  if (!entry || isEmptyUsagePoint(entry)) {
    return '';
  }

  return entry[dataKey];
};

const isUsageDataItem = (value: unknown): value is UsageDataItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    'name' in value &&
    'idle' in value &&
    'utilized' in value &&
    'devices' in value
  );
};

const chartAxisLineStyle = {
  stroke: 'var(--mui-palette-divider)',
  strokeWidth: 1,
};

const chartTickLineStyle = {
  stroke: 'var(--mui-palette-divider)',
  strokeWidth: 1,
};

const AllDevicesUsageCard = ({
  usageTimeframe,
  setUsageTimeframe,
  currentChartData,
}: AllDevicesUsageCardProps) => {
  return (
    <div
      className={composeDashboardClasses(
        'card',
        'dashboard-grid-span-1',
        'usage-card',
      )}
    >
      <CardHeader
        title="All Devices Usage"
        rightElement={
          <div className={composeDashboardClasses('toggle-group')}>
            <button
              className={composeDashboardClasses(
                'toggle-btn',
                usageTimeframe === 'weekly' && 'active',
              )}
              onClick={() => setUsageTimeframe('weekly')}
            >
              Weekly
            </button>
            <button
              className={composeDashboardClasses(
                'toggle-btn',
                usageTimeframe === 'monthly' && 'active',
              )}
              onClick={() => setUsageTimeframe('monthly')}
            >
              Monthly
            </button>
          </div>
        }
      />
      <div
        className={composeDashboardClasses(
          'bar-chart-container',
          'usage-chart-container',
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={currentChartData}
            margin={{ top: 30, right: 40, left: 40, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal
              vertical
              stroke="var(--mui-palette-divider)"
              strokeOpacity={0.7}
            />
            <XAxis
              dataKey="name"
              axisLine={chartAxisLineStyle}
              tickLine={chartTickLineStyle}
              tick={{ fontSize: 12, fill: 'var(--mui-palette-text-secondary)' }}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              axisLine={chartAxisLineStyle}
              tickLine={chartTickLineStyle}
              tick={{
                fontSize: 12,
                fill: 'var(--mui-palette-text-secondary)',
                dx: -5,
              }}
              label={{
                value: 'Hours',
                angle: -90,
                position: 'insideLeft',
                offset: -20,
                style: {
                  fill: 'var(--mui-palette-text-muted)',
                  fontSize: 14,
                  fontWeight: 500,
                },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={chartAxisLineStyle}
              tickLine={chartTickLineStyle}
              tick={{
                fontSize: 12,
                fill: 'var(--mui-palette-text-secondary)',
                dx: 5,
              }}
              label={{
                value: 'Devices',
                angle: 90,
                position: 'insideRight',
                offset: -20,
                style: {
                  fill: 'var(--mui-palette-text-muted)',
                  fontSize: 14,
                  fontWeight: 500,
                },
              }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.15)' }}
              content={<UsageChartTooltip />}
            />
            <Legend
              iconType="square"
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
            <Bar
              yAxisId="left"
              dataKey="idle"
              name="Device Idle"
              fill="var(--mui-palette-info-main)"
              barSize={24}
              animationDuration={500}
            >
              <LabelList
                valueAccessor={(entry) =>
                  getUsageLabelValue(
                    'idle',
                    'payload' in entry && isUsageDataItem(entry.payload)
                      ? entry.payload
                      : undefined,
                  )
                }
                position="top"
                dy={-2}
                fill="var(--mui-palette-text-strong)"
                fontSize={11}
                fontWeight="bold"
              />
            </Bar>
            <Bar
              yAxisId="left"
              dataKey="utilized"
              name="Device Utilized"
              fill="var(--mui-palette-success-main)"
              barSize={24}
              animationDuration={500}
            >
              <LabelList
                valueAccessor={(entry) =>
                  getUsageLabelValue(
                    'utilized',
                    'payload' in entry && isUsageDataItem(entry.payload)
                      ? entry.payload
                      : undefined,
                  )
                }
                position="top"
                dy={-8}
                fill="var(--mui-palette-text-strong)"
                fontSize={11}
                fontWeight="bold"
              />
            </Bar>
            <Bar
              yAxisId="right"
              dataKey="devices"
              name="Number of Devices"
              fill="var(--mui-palette-warning2-main)"
              barSize={24}
              animationDuration={500}
            >
              <LabelList
                valueAccessor={(entry) =>
                  getUsageLabelValue(
                    'devices',
                    'payload' in entry && isUsageDataItem(entry.payload)
                      ? entry.payload
                      : undefined,
                  )
                }
                position="top"
                dy={-14}
                fill="var(--mui-palette-text-strong)"
                fontSize={11}
                fontWeight="bold"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AllDevicesUsageCard;
