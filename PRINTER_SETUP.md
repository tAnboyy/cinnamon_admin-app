# Star TSP100 Printer Setup Guide

## Overview
The admin app now includes receipt printing functionality for Star TSP100 printers. The system supports both automatic printer discovery and manual IP entry.

## Setup Instructions

### 1. Printer Setup
- Connect your Star TSP100 printer to your network (WiFi/Ethernet)
- Ensure the printer is powered on
- Load receipt paper
- Note your printer's IP address (can be found on printer settings or network admin panel)

### 2. App Setup
The app will automatically attempt to discover printers when you open the Today's Orders screen.

### 3. Printing a Receipt

#### Option A: Automatic Discovery
1. Open Today's Orders screen
2. Tap on an order to view details
3. Tap the "🖨️ Print Receipt" button
4. If a printer was auto-discovered, it will print immediately
5. If multiple printers found, select from the list

#### Option B: Manual IP Entry
1. Open Today's Orders screen
2. Tap on an order to view details
3. Tap the "🖨️ Print Receipt" button
4. If no printers found, enter your printer's IP address manually
   - Example: `192.168.1.100`
5. Tap "Use This Printer"
6. The receipt will print and the IP will be saved for future use

## Troubleshooting

### Printer Not Found
- Check that printer is on the same network as your device
- Verify printer is powered on
- Try entering the IP address manually
- Check console logs for detailed error messages

### Print Fails
- Ensure printer has paper loaded
- Check network connection
- Verify printer is not in an error state (paper jam, etc.)
- Check console logs starting with `[PrinterService]` for details

### Finding Your Printer's IP Address
1. **From Printer**: Print a configuration page (usually by holding feed button)
2. **From Network**: Check your router's DHCP client list
3. **From Star Utility**: Use Star Micronics' official utility app

## Common IP Formats
The app automatically formats manual IPs as:
- Input: `192.168.1.100`
- Used: `TCP:192.168.1.100`

## Receipt Format
Printed receipts include:
- Restaurant name (CINNAMON RESTAURANT)
- Order ID
- Customer name
- Pickup time
- Order status
- Delivery address (if applicable)
- List of items with quantities
- Total price
- Thank you message

## Console Logging
For debugging, all print operations log to console with `[PrinterService]` or `[Screen]` prefixes:
```
[PrinterService] Starting printer discovery...
[PrinterService] Printer found: TCP:192.168.1.100
[PrinterService] Discovery finished. Found 1 printers
[Screen] Using manual printer: TCP:192.168.1.100
[PrinterService] Attempting to print receipt for order: 1
[PrinterService] Opening printer connection...
[PrinterService] Print successful!
```

## Technical Details
- SDK: react-native-star-io10 v1.10.2
- Supported Interfaces: LAN (TCP), Bluetooth
- Supported Models: Star TSP100 series (TSP143III, TSP143IIIU, etc.)
- Receipt Width: 80mm (standard)
- Command Format: StarXpandCommand

## Support
For issues or questions, check the console logs and ensure:
1. Printer is on the same network
2. Firewall isn't blocking communication
3. Printer firmware is up to date
