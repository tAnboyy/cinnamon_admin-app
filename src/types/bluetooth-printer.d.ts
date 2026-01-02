declare module 'react-native-bluetooth-escpos-printer' {
  export interface PrinterDevice {
    name: string;
    address: string;
  }

  export interface BluetoothEscposPrinter {
    deviceDiscovered(): Promise<PrinterDevice[]>;
    connect(address: string): Promise<void>;
    disconnect(): Promise<void>;
    printText(text: string): Promise<void>;
    printRow(options: any): Promise<void>;
    setAlignment(alignment: number): Promise<void>;
    printBill(bill: string): Promise<void>;
    printQrCode(code: string): Promise<void>;
    lineWrap(line: number): Promise<void>;
  }

  const BluetoothEscposPrinter: BluetoothEscposPrinter;
  export default BluetoothEscposPrinter;
}
