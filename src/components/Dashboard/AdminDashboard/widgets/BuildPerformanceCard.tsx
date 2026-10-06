import { Layers, Server } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBuildsPerformanceRequest, RootState } from 'store/index';
import { useAlertSocket } from 'hooks/useAlertSocket';
import { AlertData } from 'services/wsClient';
import { BuildPerformanceData } from 'types/analytics';
import { BuildPerformanceItem } from '../types';
import CardHeader from './CardHeader';
import { composeDashboardClasses } from '../styles/dashboardStyles';

interface BuildPerformanceCardProps {
  onBuildClick?: (build: BuildPerformanceItem) => void;
}

const BuildPerformanceCard = ({ onBuildClick }: BuildPerformanceCardProps) => {
  const dispatch = useDispatch();
  const buildPerformance = useSelector(
    (state: RootState) => state.dashboard.buildsPerformance,
  );

  useEffect(() => {
    dispatch(fetchBuildsPerformanceRequest());
  }, [dispatch]);

  useAlertSocket((alert: AlertData) => {
    if (
      alert.subtype === 'build-flagged' ||
      alert.subtype === 'test-result-changed'
    ) {
      dispatch(fetchBuildsPerformanceRequest());
    }
  });

  const transformedBuilds = useMemo(() => {
    return buildPerformance.map((build: BuildPerformanceData) => {
      const total = build.passedTestCaseCount + build.failedTestCaseCount;
      const passPercent =
        total > 0
          ? Number(((build.passedTestCaseCount / total) * 100).toFixed(1))
          : 0;

      return {
        ...build,
        status: build.flagged ? 'Flagged' : 'Active',
        version: build.buildVersion || build.buildId || 'Unknown',
        passPercent,
        devices: build.uniqueDeviceCount,
        pass: build.passedTestCaseCount,
        fail: build.failedTestCaseCount,
        tags: build.deviceType ? [build.deviceType] : [],
      } as BuildPerformanceItem;
    });
  }, [buildPerformance]);

  const getStatusClassName = (statusVal: string | null) => {
    const status = statusVal || 'Active';
    if (status === 'Latest') return 'status-tag-latest';
    if (status === 'Stable') return 'status-tag-stable';
    if (status === 'Flagged') return 'status-tag-issues';
    if (status === 'Active') return 'status-tag-stable';
    if (status === 'Deprecated') return 'status-tag-deprecated';

    return 'status-tag-issues';
  };

  return (
    <div className={composeDashboardClasses('card')}>
      <CardHeader
        icon={Layers}
        title="Build Performance"
        iconColor="var(--mui-palette-secondary-main)"
      />
      <div className={composeDashboardClasses('build-list-container')}>
        {transformedBuilds && transformedBuilds.length > 0 ? (
          transformedBuilds.map((build, idx) => (
            <div
              key={idx}
              className={composeDashboardClasses(
                'build-item-card',
                'clickable-card',
              )}
              onClick={() => onBuildClick?.(build)}
            >
              <div className={composeDashboardClasses('build-header-row')}>
                <div className={composeDashboardClasses('build-version-group')}>
                  <span className={composeDashboardClasses('build-version')}>
                    {build.version}
                  </span>
                  <span
                    className={composeDashboardClasses(
                      getStatusClassName(build.status),
                    )}
                  >
                    {build.flagged ? 'Flagged' : 'Active'}
                  </span>
                </div>
                <span className={composeDashboardClasses('build-percent')}>
                  {build.passPercent}%
                </span>
              </div>
              <div className={composeDashboardClasses('build-stats-row')}>
                <div className={composeDashboardClasses('build-device-row')}>
                  <Server size={14} color="var(--mui-palette-text-muted)" />
                  <span>{build.devices} devices</span>
                </div>
                <div
                  className={composeDashboardClasses('build-pass-fail-text')}
                >
                  <span className={composeDashboardClasses('text-pass')}>
                    {build.pass} pass
                  </span>
                  <span className={composeDashboardClasses('text-fail')}>
                    {build.fail} fail
                  </span>
                </div>
              </div>
              <div className={composeDashboardClasses('build-progress-bar')}>
                <div
                  className={composeDashboardClasses('build-progress-pass')}
                  style={{ width: `${build.passPercent}%` }}
                />
                <div
                  className={composeDashboardClasses('build-progress-fail')}
                  style={{ width: `${100 - build.passPercent}%` }}
                />
              </div>
              {build.tags &&
                build.tags.length > 0 &&
                (() => {
                  const validTags = build.tags.filter(
                    (tag) => !tag.startsWith('+'),
                  );
                  const displayCount = 4;
                  const hasMore = validTags.length > displayCount;

                  return (
                    <div className={composeDashboardClasses('build-tags-row')}>
                      {validTags.slice(0, displayCount).map((tag) => (
                        <span
                          key={tag}
                          className={composeDashboardClasses('build-tag-item')}
                        >
                          {tag}
                        </span>
                      ))}
                      {hasMore && (
                        <span
                          className={composeDashboardClasses('build-tag-item')}
                        >
                          +{validTags.length - displayCount}
                        </span>
                      )}
                    </div>
                  );
                })()}
            </div>
          ))
        ) : (
          <div className={composeDashboardClasses('alerts-empty-state')}>
            No build data available
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildPerformanceCard;
