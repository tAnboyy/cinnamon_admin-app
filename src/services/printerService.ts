import { StarDeviceDiscoveryManager, StarPrinter, InterfaceType, StarXpandCommand } from 'react-native-star-io10';
import { Order } from '../data/dummyData';

export interface PrinterDevice {
  name: string;
  identifier: string;
  interfaceType: InterfaceType;
}

class PrinterService {
  /**
   * Discover available Star printers on the network
   */
  async discoverPrinters(): Promise<PrinterDevice[]> {
    console.log('[PrinterService] Starting printer discovery...');
    const printers: PrinterDevice[] = [];
    const manager = new StarDeviceDiscoveryManager(
      [InterfaceType.Lan, InterfaceType.Bluetooth],
      ''
    );

    return new Promise((resolve) => {
      manager.onPrinterFound = (printer) => {
        console.log('[PrinterService] Printer found:', printer.connectionSettings.identifier);
        printers.push({
          name: printer.information?.model || 'Star Printer',
          identifier: printer.connectionSettings.identifier,
          interfaceType: printer.connectionSettings.interfaceType,
        });
      };

      manager.onDiscoveryFinished = () => {
        console.log('[PrinterService] Discovery finished. Found', printers.length, 'printers');
        resolve(printers);
      };

      manager.startDiscovery();

      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('[PrinterService] Discovery timeout reached');
        manager.stopDiscovery();
        resolve(printers);
      }, 5000);
    });
  }

  /**
   * Format and print a receipt for an order
   */
  async printReceipt(order: Order, printerIdentifier: string): Promise<void> {
    console.log('[PrinterService] Attempting to print receipt for order:', order.id);
    console.log('[PrinterService] Using printer:', printerIdentifier);
    
    try {
      const printer = new StarPrinter({
        interfaceType: InterfaceType.Lan,
        identifier: printerIdentifier,
        autoSwitchInterface: true,
      });

      console.log('[PrinterService] Opening printer connection...');
      await printer.open();
      console.log('[PrinterService] Printer connection opened');

      try {
        const builder = new StarXpandCommand.StarXpandCommandBuilder();
        builder.addDocument(
          new StarXpandCommand.DocumentBuilder()
            .addPrinter(
              new StarXpandCommand.PrinterBuilder()
                // Header
                .styleAlignment(StarXpandCommand.Printer.Alignment.Center)
                .styleBold(true)
                .actionPrintText('CINNAMON RESTAURANT\n')
                .styleBold(false)
                .actionPrintText('--------------------------------\n')
                .styleAlignment(StarXpandCommand.Printer.Alignment.Left)
                
                // Order Info
                .actionPrintText(`Order ID: ${order.id}\n`)
                .actionPrintText(`Customer: ${order.customerName}\n`)
                .actionPrintText(`Pickup: ${order.pickupTime}\n`)
                .actionPrintText(`Status: ${order.status}\n`)
                
                // Address if exists
                .add(
                  order.address
                    ? new StarXpandCommand.PrinterBuilder()
                        .actionPrintText(`Address: ${order.address}\n`)
                    : new StarXpandCommand.PrinterBuilder()
                )
                
                .actionPrintText('--------------------------------\n')
                .styleBold(true)
                .actionPrintText('ITEMS:\n')
                .styleBold(false)
                
                // Items
                .add(
                  this.buildItemsList(order.items)
                )
                
                .actionPrintText('--------------------------------\n')
                .styleAlignment(StarXpandCommand.Printer.Alignment.Right)
                .styleBold(true)
                .actionPrintText(`TOTAL: $${order.totalPrice.toFixed(2)}\n`)
                .styleBold(false)
                .styleAlignment(StarXpandCommand.Printer.Alignment.Center)
                .actionPrintText('\n')
                .actionPrintText('Thank you for your order!\n')
                .actionPrintText('\n\n')
                
                // Cut paper
                .actionCut(StarXpandCommand.Printer.CutType.Partial)
            )
        );

        console.log('[PrinterService] Building print commands...');
        const commands = await builder.getCommands();
        console.log('[PrinterService] Sending to printer...');
        await printer.print(commands);
        console.log('[PrinterService] Print successful!');
      } finally {
        console.log('[PrinterService] Closing printer connection...');
        await printer.close();
        console.log('[PrinterService] Printer connection closed');
      }
    } catch (error) {
      console.error('[PrinterService] Print error:', error);
      throw error;
    }
  }

  /**
   * Helper to build items list for receipt
   */
  private buildItemsList(items: { name: string; quantity: number }[]): StarXpandCommand.PrinterBuilder {
    const builder = new StarXpandCommand.PrinterBuilder();
    
    items.forEach((item) => {
      builder.actionPrintText(`${item.quantity}x ${item.name}\n`);
    });
    
    return builder;
  }

  /**
   * Print a test receipt to verify printer connectivity
   */
  async printTestReceipt(printerIdentifier: string): Promise<void> {
    const testOrder: Order = {
      id: 'TEST-001',
      customerName: 'Test Customer',
      items: [
        { name: 'Test Item 1', quantity: 1 },
        { name: 'Test Item 2', quantity: 2 },
      ],
      totalPrice: 15.99,
      pickupTime: new Date().toLocaleTimeString(),
      status: 'Pending',
    };

    await this.printReceipt(testOrder, printerIdentifier);
  }
}

export default new PrinterService();
