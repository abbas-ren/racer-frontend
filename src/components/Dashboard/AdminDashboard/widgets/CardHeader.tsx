import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { composeDashboardClasses } from '../styles/dashboardStyles';

interface CardHeaderProps {
  icon?: LucideIcon;
  title: ReactNode;
  rightElement?: ReactNode;
  iconColor?: string;
}

const CardHeader = ({
  icon: Icon,
  title,
  rightElement,
  iconColor = 'var(--mui-palette-info-main)',
}: CardHeaderProps) => (
  <div className={composeDashboardClasses('card-header')}>
    <div className={composeDashboardClasses('card-title-group')}>
      {Icon && <Icon size={20} color={iconColor} />}
      <h2 className={composeDashboardClasses('card-title')}>{title}</h2>
    </div>
    {rightElement}
  </div>
);

export default CardHeader;
