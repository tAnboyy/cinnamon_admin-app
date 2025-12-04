export interface Order {
    id: string;
    customerName: string;
    items: { name: string; quantity: number }[];
    totalPrice: number;
    pickupTime: string;
    status: 'Pending' | 'Ready' | 'Completed' | 'Cancelled';
    address?: string;
  }
  
  export const orders: Order[] = [
    {
      id: '1',
      customerName: 'John Doe',
      items: [{ name: 'Classic Burger', quantity: 2 }],
      totalPrice: 25.98,
      pickupTime: '12:30 PM',
      status: 'Pending',
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      items: [{ name: 'Margherita Pizza', quantity: 1 }],
      totalPrice: 15.99,
      pickupTime: '1:00 PM',
      status: 'Ready',
    },
    {
        id: '3',
        customerName: 'Peter Jones',
        items: [{ name: 'Party Platter', quantity: 1 }],
        totalPrice: 49.99,
        pickupTime: 'Tomorrow, 6:00 PM',
        status: 'Pending',
        address: '123 Main St, Anytown, USA'
    }
  ];
  
  export interface MealPlan {
      id: string;
      customerName: string;
      nextPickup: string;
  }

  export const mealPlans: MealPlan[] = [
      {
          id: '1',
          customerName: 'Alice Johnson',
          nextPickup: 'Tomorrow, 12:00 PM'
      }
  ]
  