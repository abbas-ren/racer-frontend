import { IDevice } from 'typesCustom/types';
import styles from './DevicesStyles.module.scss';

interface Gen3InterfaceConnectionProps {
  heartbeat: any;
  device: IDevice;
}

type STATUS = 'connected' | 'disconnected' | 'up' | 'down' | 'unknown';

type USBInfo = Record<string, { status: STATUS }> | { 'not present': string };
type AudioDSP = Record<string, { status: STATUS }> | { 'not present': string };
type Network = Record<string, { status: STATUS }> | { 'not present': string };
type HDMI = Record<string, { status: STATUS }> | { 'not present': string };
type CSI = Record<string, { status: STATUS }> | { 'not present': string };
type PCI = Record<string, { status: STATUS }> | { 'not present': string };
type LVDS = Record<string, { status: STATUS }> | { 'not present': string };
type VGA = Record<string, { status: STATUS }> | { 'not present': string };
type SD = Record<string, { status: STATUS }> | { 'not present': string };
type SATA = Record<string, { status: STATUS }> | { 'not present': string };
type CAN = Record<string, { status: STATUS }> | { 'not present': string };
type Temperature = Record<string, { temp: number }> | { 'not present': string };
type I2C = Record<string, { slave: string[] }> | { 'not present': string };

const ACTIVE_COLOR = '#1DBD53';
const INACTIVE_COLOR = '#7F7F7F';

function isUnavailable(
  data:
    | USBInfo
    | AudioDSP
    | Network
    | HDMI
    | Temperature
    | CSI
    | I2C
    | PCI
    | LVDS
    | VGA
    | SD
    | SATA
    | CAN
    | null
    | undefined,
): 'NA' | 'DC' | 'OK' {
  if (!data || 'not present' in data) {
    return 'NA';
  }

  const values = Object.values(data);
  const availableStatuses = ['up', 'connected'];
  const unavailableStatuses = ['unknown', 'disconnected', 'down'];

  const hasAvailable = values.some((entry: any) => {
    if (typeof entry?.status === 'string') {
      const normalized = entry.status.trim().toLowerCase();
      return availableStatuses.includes(normalized);
    }
    return false;
  });

  if (hasAvailable) {
    return 'OK';
  }

  const hasUnavailable = values.some((entry: any) => {
    if (typeof entry?.status === 'string') {
      const normalized = entry.status.trim().toLowerCase();
      return unavailableStatuses.includes(normalized);
    }
    return false;
  });

  return hasUnavailable ? 'DC' : 'OK';
}

const getColor = (status: 'NA' | 'DC' | 'OK') => {
  switch (status) {
    case 'NA':
      return { bg: 'white', text: INACTIVE_COLOR };
      break;
    case 'DC':
      return { bg: INACTIVE_COLOR, text: 'white' };
      break;
    default:
      return { bg: ACTIVE_COLOR, text: 'white' };
      break;
  }
};

const Gen3InterfaceConnectionBoard = ({
  heartbeat,
  device,
}: Gen3InterfaceConnectionProps) => {
  const heartbeatData =
    typeof heartbeat?.data === 'string'
      ? JSON.parse(heartbeat?.data)
      : heartbeat?.data;

  const usb = heartbeatData?.usb as USBInfo | undefined;
  const audio = heartbeatData?.audio as AudioDSP | undefined;
  const network = heartbeatData?.network as Network | undefined;
  const hdmi = heartbeatData?.hdmi as HDMI | undefined;
  const temperature = heartbeatData?.temperature as Temperature | undefined;
  const csi = heartbeatData?.csi as CSI | undefined;
  const i2c = heartbeatData?.i2c as I2C | undefined;
  const pci = heartbeatData?.pci as PCI | undefined;
  const lvds = heartbeatData?.lvds as LVDS | undefined;
  const vga = heartbeatData?.vga as VGA | undefined;
  const sd = heartbeatData?.sd as SD | undefined;
  const sata = heartbeatData?.sata as SATA | undefined;
  const can = heartbeatData?.can as CAN | undefined;

  // const audioOutput = heartbeatData?.audio['headphone'];
  // const audioInput = heartbeatData?.audio['microphone'];

  return (
    <div className={styles.gen3_device_container}>
      <svg
        width="100%"
        height="538"
        viewBox="0 0 544 409"
        fill="none"
        style={{
          overflow: 'visible',
          height: 'fit-content',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="35.5"
          y="11.5"
          width="475"
          height="378"
          rx="9.5"
          fill="#E5F0FB"
          stroke="#6764FF"
        />

        <rect
          x="183.5"
          y="101.5"
          width="179"
          height="199"
          rx="9.5"
          fill="#3835D1"
          stroke="#6764FF"
        />
        <text
          x="273"
          y="205"
          fontFamily="Arial"
          fontSize="18"
          fill="white"
          textAnchor="middle"
        >
          {device?.deviceType || 'Gen3'}
        </text>

        <rect
          y="46"
          width={!usb ? '66' : '78'}
          height="39"
          x={!usb ? '0' : '-12'}
          rx="6"
          fill={getColor(isUnavailable(usb!)).bg}
          stroke={getColor(isUnavailable(usb!)).text}
        />
        <text
          x="33"
          y="65"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(usb!)).text}
          textAnchor="middle"
        >
          {!usb ? (
            <tspan x="33" dy="4">
              {device?.interfaces.filter((r) => r.type === 'usb').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'usb').length}x USB`
                : 'USB'}
            </tspan>
          ) : (
            <>
              <tspan x={!usb ? '33' : '28'} dy="4">
                {usb && Object.keys(usb).length > 1
                  ? `${Object.keys(usb).length}x USB`
                  : 'USB'}
              </tspan>
              {/* {usb && Object.keys(usb).length > 1 && (
              <tspan x={!usb ? '33' : '28'} dy="12">
                (
                {Object.values(usb)
                  .map((d) => d.version)
                  .join(', ')}
                )
              </tspan>
            )} */}
            </>
          )}
        </text>

        {/* <rect
        x="478"
        y="46"
        width="66"
        height="21"
        rx="6"
        fill={
          !heartbeat
            ? 'white'
            : isUnavailable(can!)
              ? INACTIVE_COLOR
              : ACTIVE_COLOR
        }
        stroke={!heartbeat ? '#7F7F7F' : ''}
      />
      <text
        x="511"
        y="62"
        fontFamily="Arial"
        fontSize="12"
        fill={!can ? '#7F7F7F' : 'white'}
        textAnchor="middle"
      >
        {!can ? (
          <tspan x="511" dy="0">
            NA
          </tspan>
        ) : (
          <tspan x="511" dy="0">
            {can && Object.keys(can).length > 1
              ? `${Object.keys(can).length}x CAN`
              : 'CAN'}{' '}
          </tspan>
        )}
      </text> */}
        <svg
          width="544"
          height="409"
          viewBox="0 0 544 409"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="126" width="82" height="21" rx="6" fill="#3A90FF" />
          <text
            x="167"
            y="15"
            fontFamily="Arial"
            fontSize="12"
            fill="white"
            textAnchor="middle"
          >
            Power
          </text>

          {/* <rect x="234" width="79" height="21" rx="6" fill="#3A90FF" />
        <text
          x="273"
          y="15"
          fontFamily="Arial"
          fontSize="12"
          fill="white"
          textAnchor="middle"
        >
          Clock
        </text> */}
        </svg>

        <path
          d="M183 185H108.909C103.386 185 98.9091 180.523 98.9091 175V173C98.9091 167.477 94.4319 163 88.9091 163H72"
          stroke="#6764FF"
        />
        <path
          d="M183 155H108.152C102.629 155 98.1515 150.523 98.1515 145V124C98.1515 118.477 93.6744 114 88.1515 114H71"
          stroke="#6764FF"
        />
        <path
          d="M183 125H133.561C128.039 125 123.561 120.523 123.561 115V75C123.561 69.4772 119.084 65 113.561 65H71"
          stroke="#6764FF"
        />
        <path
          d="M365 125L413 125C417.142 125 420.5 121.642 420.5 117.5V117.5C420.5 113.358 423.858 110 428 110H474"
          stroke="#6764FF"
        />
        {/* <path
        d="M474 56L329 56C323.477 56 319 60.4772 319 66V99"
        stroke="#6764FF"
      /> */}
        <path
          d="M366 154H415.751C418.513 154 420.751 156.239 420.751 159V159C420.751 161.761 422.99 164 425.751 164H476"
          stroke="#6764FF"
        />
        <path
          d="M365 185H414.267C419.79 185 424.267 189.477 424.267 195L424.267 208C424.267 213.523 428.744 218 434.267 218H476"
          stroke="#6764FF"
        />
        <path
          d="M363 245H410.262C415.785 245 420.262 249.477 420.262 255V262C420.262 267.523 424.739 272 430.262 272H474"
          stroke="#6764FF"
        />
        <path
          d="M363 275H402.284C407.807 275 412.284 279.477 412.284 285V316C412.284 321.523 416.761 326 422.284 326H474"
          stroke="#6764FF"
        />
        <path
          d="M183 215H146C140.753 215 136.5 219.253 136.5 224.5V224.5C136.5 229.747 132.247 234 127 234H69"
          stroke="#6764FF"
        />
        <path
          d="M183 245L159.202 245.71C153.797 245.872 149.5 250.299 149.5 255.706V273C149.5 278.523 145.023 283 139.5 283H69"
          stroke="#6764FF"
        />
        <path
          d="M183 275H170.5C164.977 275 160.5 279.477 160.5 285V313C160.5 318.523 156.023 323 150.5 323L69 323"
          stroke="#6764FF"
        />
        <path
          d="M254 301V322.333C254 327.856 249.523 332.333 244 332.333H214C208.477 332.333 204 336.81 204 342.333V367"
          stroke="#6764FF"
        />
        {/* <path d="M273 99L273 26" stroke="#6764FF" /> */}
        <path
          d="M227 99L227 68.1608C227 62.638 222.523 58.1608 217 58.1608L177 58.1608C171.477 58.1608 167 53.6837 167 48.1608L167 26"
          stroke="#6764FF"
        />
        <path
          d="M294 301V322.333C294 327.856 298.477 332.333 304 332.333H334C339.523 332.333 344 336.81 344 342.333V367"
          stroke="#6764FF"
        />
        <rect
          x="5"
          y="95"
          width="61"
          height="39"
          rx="6"
          fill={getColor(isUnavailable(audio!)).bg}
          stroke={getColor(isUnavailable(audio!)).text}
        />
        <text
          x="35.5"
          y="112"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(audio!)).text}
          textAnchor="middle"
        >
          {!audio ? (
            <tspan x="35.5" dy="6">
              {device?.interfaces.filter((r) => r.type === 'audio').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'audio').length}x Audio`
                : 'Audio DSP'}
            </tspan>
          ) : (
            <tspan x="35.5" dy="6">
              {audio && Object.keys(audio).length > 1
                ? `${Object.keys(audio).length}x Audio`
                : 'Audio DSP'}
            </tspan>
          )}
        </text>

        <rect
          x="478"
          y="98"
          width={'80'}
          height="26"
          rx="6"
          fill={getColor(isUnavailable(network!)).bg}
          stroke={getColor(isUnavailable(network!)).text}
        />
        <text
          x="511"
          y="115"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(network!)).text}
          textAnchor="middle"
        >
          {!network ? (
            <tspan x="518" dy="0">
              {device?.interfaces.filter((r) => r.type === 'network').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'network').length}x Network`
                : 'Network'}
            </tspan>
          ) : (
            <tspan x={'518'} dy="0">
              {network && Object.keys(network).length > 1
                ? `${Object.keys(network).length}x Network`
                : 'Network'}
            </tspan>
          )}
        </text>

        <rect
          x="5"
          y="144"
          width="61"
          height="39"
          rx="6"
          fill={getColor(isUnavailable(hdmi!)).bg}
          stroke={getColor(isUnavailable(hdmi!)).text}
        />
        <text
          x="35.5"
          y="168"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(hdmi!)).text}
          textAnchor="middle"
        >
          {!hdmi ? (
            <tspan x="35.5" dy="0">
              {device?.interfaces.filter((r) => r.type === 'hdmi').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'hdmi').length}x HDMI`
                : 'HDMI'}
            </tspan>
          ) : (
            <tspan x="35.5" dy="0">
              {hdmi && Object.keys(hdmi).length > 1
                ? `${Object.keys(hdmi).length}x HDMI`
                : 'HDMI'}{' '}
            </tspan>
          )}
        </text>
        <rect
          x="480"
          y="146"
          width={'80'}
          height="36"
          rx="6"
          fill={getColor(isUnavailable(temperature!)).bg}
          stroke={getColor(isUnavailable(temperature!)).text}
        />

        <text
          x={!temperature ? 511.5 : 520}
          y="158"
          fontFamily="Arial"
          fontSize="10"
          fill={getColor(isUnavailable(temperature!)).text}
          textAnchor="middle"
        >
          {!temperature ? (
            <tspan x="520" dy="4">
              {device?.interfaces.filter((r) => r.type === 'temperature')
                .length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'temperature').length}x`
                : 'Temperature'}
              {device?.interfaces.filter((r) => r.type === 'temperature')
                .length > 1 && (
                <tspan x="520" dy="12">
                  Temperature
                </tspan>
              )}
            </tspan>
          ) : (
            <>
              <tspan x="520" dy="4">
                {Object.keys(temperature).length > 1
                  ? `${Object.keys(temperature).length}x`
                  : 'Temperature'}
              </tspan>
              {Object.keys(temperature).length > 1 && (
                <tspan x="520" dy="12">
                  Temperature
                </tspan>
              )}
            </>
          )}
        </text>

        <rect
          x="5"
          y="213"
          width="61"
          height="39"
          rx="6"
          fill={getColor(isUnavailable(pci!)).bg}
          stroke={getColor(isUnavailable(pci!)).text}
        />
        <text
          x="35.5"
          y="237"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(pci!)).text}
          textAnchor="middle"
        >
          {!pci ? (
            <tspan x="35.5" dy="0">
              {device?.interfaces.filter((r) => r.type === 'pci').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'pci').length}x PCI`
                : 'PCI'}
            </tspan>
          ) : (
            <tspan x="35.5" dy="0">
              {pci && Object.keys(pci).length > 1
                ? `${Object.keys(pci).length}x PCI`
                : 'PCI'}{' '}
            </tspan>
          )}
        </text>

        <rect
          x="480"
          y="208"
          width="61"
          height="21"
          rx="6"
          fill={getColor(isUnavailable(lvds!)).bg}
          stroke={getColor(isUnavailable(lvds!)).text}
        />
        <text
          x="510.5"
          y="223"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(lvds!)).text}
          textAnchor="middle"
        >
          {!lvds ? (
            <tspan x="510.5" dy="0">
              {device?.interfaces.filter((r) => r.type === 'lvds').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'lvds').length}x LVDS`
                : 'LVDS'}
            </tspan>
          ) : (
            <tspan x="510.5" dy="0">
              {lvds && Object.keys(lvds).length > 1
                ? `${Object.keys(lvds).length}x LVDS`
                : 'LVDS'}{' '}
            </tspan>
          )}
        </text>

        <rect
          x="5"
          y="262"
          width="61"
          height="39"
          rx="6"
          fill={getColor(isUnavailable(vga!)).bg}
          stroke={getColor(isUnavailable(vga!)).text}
        />
        <text
          x="35.5"
          y="286"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(vga!)).text}
          textAnchor="middle"
        >
          {!vga ? (
            <tspan x="35.5" dy="0">
              {device?.interfaces.filter((r) => r.type === 'vga').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'vga').length}x VGA`
                : 'VGA'}
            </tspan>
          ) : (
            <tspan x="35.5" dy="0">
              {vga && Object.keys(vga).length > 1
                ? `${Object.keys(vga).length}x VGA`
                : 'VGA'}{' '}
            </tspan>
          )}
        </text>

        <rect
          x="5"
          y="311"
          width="61"
          height="21"
          rx="6"
          fill={getColor(isUnavailable(csi!)).bg}
          stroke={getColor(isUnavailable(csi!)).text}
        />
        <text
          x="35.5"
          y="326"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(csi!)).text}
          textAnchor="middle"
        >
          {!csi ? (
            <tspan x="35.5" dy="0">
              {device?.interfaces.filter((r) => r.type === 'csi').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'csi').length}x CSI`
                : 'CSI'}
            </tspan>
          ) : (
            <tspan x="35.5" dy="0">
              {csi && Object.keys(csi).length > 1
                ? `${Object.keys(csi).length}x CSI`
                : 'CSI'}{' '}
            </tspan>
          )}
        </text>

        <rect
          x="478"
          y="262"
          width="65"
          height="21"
          rx="6"
          fill={getColor(isUnavailable(sd!)).bg}
          stroke={getColor(isUnavailable(sd!)).text}
        />
        <text
          x="510.5"
          y="277"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(sd!)).text}
          textAnchor="middle"
        >
          {!sd ? (
            <tspan x="510.5" dy="0">
              {device?.interfaces.filter((r) => r.type === 'sd').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'sd').length}x SD`
                : 'SD'}
            </tspan>
          ) : (
            <tspan x="510.5" dy="0">
              {sd && Object.keys(sd).length > 1
                ? `${Object.keys(sd).length}x SD`
                : 'SD'}{' '}
            </tspan>
          )}
        </text>

        <rect
          x="478"
          y="316"
          width="65"
          height="21"
          rx="6"
          fill={getColor(isUnavailable(sata!)).bg}
          stroke={getColor(isUnavailable(sata!)).text}
        />
        <text
          x="510.5"
          y="331"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(sata!)).text}
          textAnchor="middle"
        >
          {!sata ? (
            <tspan x="510.5" dy="0">
              {device?.interfaces.filter((r) => r.type === 'sata').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'sata').length}x SATA`
                : 'SATA'}
            </tspan>
          ) : (
            <tspan x="510.5" dy="0">
              {sata && Object.keys(sata).length > 1
                ? `${Object.keys(sata).length}x SATA`
                : 'SATA'}{' '}
            </tspan>
          )}
        </text>

        <rect
          x="173"
          y="370"
          width="61"
          height="28"
          rx="6"
          fill={getColor(isUnavailable(i2c!)).bg}
          stroke={getColor(isUnavailable(i2c!)).text}
        />
        <text
          x="203.5"
          y="388"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(i2c!)).text}
          textAnchor="middle"
        >
          {!i2c ? (
            <tspan x="203.5" dy="0">
              {device?.interfaces.filter((r) => r.type === 'i2c').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'i2c').length}x i2c`
                : 'i2c'}
            </tspan>
          ) : (
            <tspan x="203.5" dy="0">
              {i2c
                ? Object.keys(i2c).length > 1
                  ? `${Object.keys(i2c).length}x i2c`
                  : 'i2c'
                : 'NA'}
            </tspan>
          )}
        </text>

        <rect
          x="313"
          y="370"
          width="61"
          height="28"
          fill={getColor(isUnavailable(can!)).bg}
          textAnchor="middle"
          rx="6"
          stroke={getColor(isUnavailable(can!)).text}
        />
        <text
          x="343.5"
          y="388"
          fontFamily="Arial"
          fontSize="12"
          fill={getColor(isUnavailable(can!)).text}
          textAnchor="middle"
        >
          {!can ? (
            <tspan x="343.5" dy="0">
              {device?.interfaces.filter((r) => r.type === 'can').length > 1
                ? `${device?.interfaces.filter((r) => r.type === 'can').length}x CAN`
                : 'CAN'}
            </tspan>
          ) : (
            <tspan x="343.5" dy="0">
              {can && Object.keys(can).length > 1
                ? `${Object.keys(can).length}x CAN`
                : 'CAN'}{' '}
            </tspan>
          )}
        </text>

        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M69.744 61.2153C69.9013 61.3501 69.9195 61.5868 69.7847 61.7441L66.9939 65L69.7847 68.256C69.9195 68.4132 69.9013 68.6499 69.744 68.7847C69.5868 68.9195 69.3501 68.9013 69.2153 68.7441L66.2153 65.2441C66.0949 65.1036 66.0949 64.8964 66.2153 64.756L69.2153 61.256C69.3501 61.0987 69.5868 61.0805 69.744 61.2153Z"
          fill="#6764FF"
        />
        <path
          d="M71.875 61.5C71.875 61.3431 71.7773 61.2028 71.6301 61.1483C71.4829 61.0939 71.3174 61.1368 71.2153 61.256L68.2153 64.756C68.0949 64.8964 68.0949 65.1036 68.2153 65.2441L71.2153 68.7441C71.3174 68.8632 71.4829 68.9062 71.6301 68.8517C71.7773 68.7973 71.875 68.657 71.875 68.5L71.875 61.5Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M170.785 24.744C170.65 24.9013 170.413 24.9195 170.256 24.7847L167 21.9939L163.744 24.7847C163.587 24.9195 163.35 24.9013 163.215 24.744C163.08 24.5868 163.099 24.3501 163.256 24.2153L166.756 21.2153C166.896 21.0949 167.104 21.0949 167.244 21.2153L170.744 24.2153C170.901 24.3501 170.919 24.5868 170.785 24.744Z"
          fill="#6764FF"
        />
        <path
          d="M170.5 26.875C170.657 26.875 170.797 26.7773 170.852 26.6301C170.906 26.4829 170.863 26.3174 170.744 26.2153L167.244 23.2153C167.104 23.0949 166.896 23.0949 166.756 23.2153L163.256 26.2153C163.137 26.3174 163.094 26.4829 163.148 26.6301C163.203 26.7773 163.343 26.875 163.5 26.875L170.5 26.875Z"
          fill="#6764FF"
        />
        {/* <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M276.785 24.744C276.65 24.9013 276.413 24.9195 276.256 24.7847L273 21.9939L269.744 24.7847C269.587 24.9195 269.35 24.9013 269.215 24.744C269.08 24.5868 269.099 24.3501 269.256 24.2153L272.756 21.2153C272.896 21.0949 273.104 21.0949 273.244 21.2153L276.744 24.2153C276.901 24.3501 276.919 24.5868 276.785 24.744Z"
        fill="#6764FF"
      /> */}
        {/* <path
        d="M276.5 26.875C276.657 26.875 276.797 26.7773 276.852 26.6301C276.906 26.4829 276.863 26.3174 276.744 26.2153L273.244 23.2153C273.104 23.0949 272.896 23.0949 272.756 23.2153L269.256 26.2153C269.137 26.3174 269.094 26.4829 269.148 26.6301C269.203 26.7773 269.343 26.875 269.5 26.875L276.5 26.875Z"
        fill="#6764FF"
      /> */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M69.744 159.215C69.9013 159.35 69.9195 159.587 69.7847 159.744L66.9939 163L69.7847 166.256C69.9195 166.413 69.9013 166.65 69.744 166.785C69.5868 166.92 69.3501 166.901 69.2153 166.744L66.2153 163.244C66.0949 163.104 66.0949 162.896 66.2153 162.756L69.2153 159.256C69.3501 159.099 69.5868 159.081 69.744 159.215Z"
          fill="#6764FF"
        />
        <path
          d="M71.875 159.5C71.875 159.343 71.7773 159.203 71.6301 159.148C71.4829 159.094 71.3174 159.137 71.2153 159.256L68.2153 162.756C68.0949 162.896 68.0949 163.104 68.2153 163.244L71.2153 166.744C71.3174 166.863 71.4829 166.906 71.6301 166.852C71.7773 166.797 71.875 166.657 71.875 166.5L71.875 159.5Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M69.744 229.215C69.9013 229.35 69.9195 229.587 69.7847 229.744L66.9939 233L69.7847 236.256C69.9195 236.413 69.9013 236.65 69.744 236.785C69.5868 236.92 69.3501 236.901 69.2153 236.744L66.2153 233.244C66.0949 233.104 66.0949 232.896 66.2153 232.756L69.2153 229.256C69.3501 229.099 69.5868 229.081 69.744 229.215Z"
          fill="#6764FF"
        />
        <path
          d="M71.875 229.5C71.875 229.343 71.7773 229.203 71.6301 229.148C71.4829 229.094 71.3174 229.137 71.2153 229.256L68.2153 232.756C68.0949 232.896 68.0949 233.104 68.2153 233.244L71.2153 236.744C71.3174 236.863 71.4829 236.906 71.6301 236.852C71.7773 236.797 71.875 236.657 71.875 236.5L71.875 229.5Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M69.744 279.215C69.9013 279.35 69.9195 279.587 69.7847 279.744L66.9939 283L69.7847 286.256C69.9195 286.413 69.9013 286.65 69.744 286.785C69.5868 286.92 69.3501 286.901 69.2153 286.744L66.2153 283.244C66.0949 283.104 66.0949 282.896 66.2153 282.756L69.2153 279.256C69.3501 279.099 69.5868 279.081 69.744 279.215Z"
          fill="#6764FF"
        />
        <path
          d="M71.875 279.5C71.875 279.343 71.7773 279.203 71.6301 279.148C71.4829 279.094 71.3174 279.137 71.2153 279.256L68.2153 282.756C68.0949 282.896 68.0949 283.104 68.2153 283.244L71.2153 286.744C71.3174 286.863 71.4829 286.906 71.6301 286.852C71.7773 286.797 71.875 286.657 71.875 286.5L71.875 279.5Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M69.744 319.215C69.9013 319.35 69.9195 319.587 69.7847 319.744L66.9939 323L69.7847 326.256C69.9195 326.413 69.9013 326.65 69.744 326.785C69.5868 326.92 69.3501 326.901 69.2153 326.744L66.2153 323.244C66.0949 323.104 66.0949 322.896 66.2153 322.756L69.2153 319.256C69.3501 319.099 69.5868 319.081 69.744 319.215Z"
          fill="#6764FF"
        />
        <path
          d="M71.875 319.5C71.875 319.343 71.7773 319.203 71.6301 319.148C71.4829 319.094 71.3174 319.137 71.2153 319.256L68.2153 322.756C68.0949 322.896 68.0949 323.104 68.2153 323.244L71.2153 326.744C71.3174 326.863 71.4829 326.906 71.6301 326.852C71.7773 326.797 71.875 326.657 71.875 326.5L71.875 319.5Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M200.215 366.256C200.35 366.099 200.587 366.08 200.744 366.215L204 369.006L207.256 366.215C207.413 366.08 207.65 366.099 207.785 366.256C207.92 366.413 207.901 366.65 207.744 366.785L204.244 369.785C204.104 369.905 203.896 369.905 203.756 369.785L200.256 366.785C200.099 366.65 200.081 366.413 200.215 366.256Z"
          fill="#6764FF"
        />
        <path
          d="M200.5 364.125C200.343 364.125 200.203 364.223 200.148 364.37C200.094 364.517 200.137 364.683 200.256 364.785L203.756 367.785C203.896 367.905 204.104 367.905 204.244 367.785L207.744 364.785C207.863 364.683 207.906 364.517 207.852 364.37C207.797 364.223 207.657 364.125 207.5 364.125L200.5 364.125Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M340.215 366.256C340.35 366.099 340.587 366.08 340.744 366.215L344 369.006L347.256 366.215C347.413 366.08 347.65 366.099 347.785 366.256C347.92 366.413 347.901 366.65 347.744 366.785L344.244 369.785C344.104 369.905 343.896 369.905 343.756 369.785L340.256 366.785C340.099 366.65 340.081 366.413 340.215 366.256Z"
          fill="#6764FF"
        />
        <path
          d="M340.5 364.125C340.343 364.125 340.203 364.223 340.148 364.37C340.094 364.517 340.137 364.683 340.256 364.785L343.756 367.785C343.896 367.905 344.104 367.905 344.244 367.785L347.744 364.785C347.863 364.683 347.906 364.517 347.852 364.37C347.797 364.223 347.657 364.125 347.5 364.125L340.5 364.125Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M69.744 110.215C69.9013 110.35 69.9195 110.587 69.7847 110.744L66.9939 114L69.7847 117.256C69.9195 117.413 69.9013 117.65 69.744 117.785C69.5868 117.92 69.3501 117.901 69.2153 117.744L66.2153 114.244C66.0949 114.104 66.0949 113.896 66.2153 113.756L69.2153 110.256C69.3501 110.099 69.5868 110.081 69.744 110.215Z"
          fill="#6764FF"
        />
        <path
          d="M71.875 110.5C71.875 110.343 71.7773 110.203 71.6301 110.148C71.4829 110.094 71.3174 110.137 71.2153 110.256L68.2153 113.756C68.0949 113.896 68.0949 114.104 68.2153 114.244L71.2153 117.744C71.3174 117.863 71.4829 117.906 71.6301 117.852C71.7773 117.797 71.875 117.657 71.875 117.5L71.875 110.5Z"
          fill="#6764FF"
        />
        {/* <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M474.256 52.2153C474.099 52.3501 474.08 52.5868 474.215 52.7441L477.006 56L474.215 59.256C474.08 59.4132 474.099 59.6499 474.256 59.7847C474.413 59.9195 474.65 59.9013 474.785 59.7441L477.785 56.2441C477.905 56.1036 477.905 55.8964 477.785 55.756L474.785 52.256C474.65 52.0987 474.413 52.0805 474.256 52.2153Z"
        fill="#6764FF"
      />
      <path
        d="M472.125 52.5C472.125 52.3431 472.223 52.2028 472.37 52.1483C472.517 52.0939 472.683 52.1368 472.785 52.256L475.785 55.756C475.905 55.8964 475.905 56.1036 475.785 56.2441L472.785 59.7441C472.683 59.8632 472.517 59.9062 472.37 59.8517C472.223 59.7973 472.125 59.657 472.125 59.5L472.125 52.5Z"
        fill="#6764FF"
      /> */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M474.256 106.215C474.099 106.35 474.08 106.587 474.215 106.744L477.006 110L474.215 113.256C474.08 113.413 474.099 113.65 474.256 113.785C474.413 113.92 474.65 113.901 474.785 113.744L477.785 110.244C477.905 110.104 477.905 109.896 477.785 109.756L474.785 106.256C474.65 106.099 474.413 106.081 474.256 106.215Z"
          fill="#6764FF"
        />
        <path
          d="M472.125 106.5C472.125 106.343 472.223 106.203 472.37 106.148C472.517 106.094 472.683 106.137 472.785 106.256L475.785 109.756C475.905 109.896 475.905 110.104 475.785 110.244L472.785 113.744C472.683 113.863 472.517 113.906 472.37 113.852C472.223 113.797 472.125 113.657 472.125 113.5L472.125 106.5Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M476.256 160.215C476.099 160.35 476.08 160.587 476.215 160.744L479.006 164L476.215 167.256C476.08 167.413 476.099 167.65 476.256 167.785C476.413 167.92 476.65 167.901 476.785 167.744L479.785 164.244C479.905 164.104 479.905 163.896 479.785 163.756L476.785 160.256C476.65 160.099 476.413 160.081 476.256 160.215Z"
          fill="#6764FF"
        />
        <path
          d="M474.125 160.5C474.125 160.343 474.223 160.203 474.37 160.148C474.517 160.094 474.683 160.137 474.785 160.256L477.785 163.756C477.905 163.896 477.905 164.104 477.785 164.244L474.785 167.744C474.683 167.863 474.517 167.906 474.37 167.852C474.223 167.797 474.125 167.657 474.125 167.5L474.125 160.5Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M476.256 214.215C476.099 214.35 476.08 214.587 476.215 214.744L479.006 218L476.215 221.256C476.08 221.413 476.099 221.65 476.256 221.785C476.413 221.92 476.65 221.901 476.785 221.744L479.785 218.244C479.905 218.104 479.905 217.896 479.785 217.756L476.785 214.256C476.65 214.099 476.413 214.081 476.256 214.215Z"
          fill="#6764FF"
        />
        <path
          d="M474.125 214.5C474.125 214.343 474.223 214.203 474.37 214.148C474.517 214.094 474.683 214.137 474.785 214.256L477.785 217.756C477.905 217.896 477.905 218.104 477.785 218.244L474.785 221.744C474.683 221.863 474.517 221.906 474.37 221.852C474.223 221.797 474.125 221.657 474.125 221.5L474.125 214.5Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M474.256 268.215C474.099 268.35 474.08 268.587 474.215 268.744L477.006 272L474.215 275.256C474.08 275.413 474.099 275.65 474.256 275.785C474.413 275.92 474.65 275.901 474.785 275.744L477.785 272.244C477.905 272.104 477.905 271.896 477.785 271.756L474.785 268.256C474.65 268.099 474.413 268.081 474.256 268.215Z"
          fill="#6764FF"
        />
        <path
          d="M472.125 268.5C472.125 268.343 472.223 268.203 472.37 268.148C472.517 268.094 472.683 268.137 472.785 268.256L475.785 271.756C475.905 271.896 475.905 272.104 475.785 272.244L472.785 275.744C472.683 275.863 472.517 275.906 472.37 275.852C472.223 275.797 472.125 275.657 472.125 275.5L472.125 268.5Z"
          fill="#6764FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M474.256 322.215C474.099 322.35 474.08 322.587 474.215 322.744L477.006 326L474.215 329.256C474.08 329.413 474.099 329.65 474.256 329.785C474.413 329.92 474.65 329.901 474.785 329.744L477.785 326.244C477.905 326.104 477.905 325.896 477.785 325.756L474.785 322.256C474.65 322.099 474.413 322.081 474.256 322.215Z"
          fill="#6764FF"
        />
        <path
          d="M472.125 322.5C472.125 322.343 472.223 322.203 472.37 322.148C472.517 322.094 472.683 322.137 472.785 322.256L475.785 325.756C475.905 325.896 475.905 326.104 475.785 326.244L472.785 329.744C472.683 329.863 472.517 329.906 472.37 329.852C472.223 329.797 472.125 329.657 472.125 329.5L472.125 322.5Z"
          fill="#6764FF"
        />
        <circle cx="227" cy="101" r="3.5" fill="white" stroke="#3835D1" />
        {/* <circle cx="273" cy="101" r="3.5" fill="white" stroke="#3835D1" /> */}
        {/* <circle cx="319" cy="101" r="3.5" fill="white" stroke="#3835D1" /> */}
        <circle cx="362" cy="125" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="184" cy="125" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="362" cy="155" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="184" cy="155" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="362" cy="185" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="184" cy="185" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="184" cy="215" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="362" cy="245" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="184" cy="245" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="362" cy="275" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="184" cy="275" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="254" cy="301" r="3.5" fill="white" stroke="#3835D1" />
        <circle cx="294" cy="301" r="3.5" fill="white" stroke="#3835D1" />
      </svg>
    </div>
  );
};

export default Gen3InterfaceConnectionBoard;
