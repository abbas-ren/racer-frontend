import clsx from 'clsx';
import styles from './DevicesStyles.module.scss';

const DeviceStatusLegend: React.FC = () => {
  return (
    <div className={clsx('flex', styles.list_container)}>
      <p datatype="available" className={clsx('flex', styles.list_items)}>
        <span></span>Available
      </p>
      <p datatype="busy" className={clsx('flex', styles.list_items)}>
        <span></span>Busy
      </p>
      <p datatype="faulty" className={clsx('flex', styles.list_items)}>
        <span></span>Faulty
      </p>
      <p datatype="not-reachable" className={clsx('flex', styles.list_items)}>
        <span>&#10005;</span>Not Reachable
      </p>
    </div>
  );
};

export default DeviceStatusLegend;
