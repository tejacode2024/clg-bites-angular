// Check if ordering is allowed (before 6 PM / 18:00)
export function isOrderingAllowed(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour < 18;
}

// Check if Food Corner ordering is allowed
// Disabled after 5:30 PM on Saturday, Sunday, Monday, Tuesday
export function isFoodCornerOrderingAllowed(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  const restrictedDays = [0, 1, 2, 6];

  if (!restrictedDays.includes(dayOfWeek)) return true;

  if (currentHour < 17) return true;
  if (currentHour === 17 && currentMinutes < 30) return true;

  return false;
}

// List of temporarily unavailable menu items per restaurant
export const unavailableItems: Record<string, string[]> = {
  'palleturu-palahaaram': ['Prawns Biryani'],
};

// Check if a specific menu item is available
export function isItemAvailable(restaurantId: string, itemName: string): boolean {
  const restaurantUnavailableItems = unavailableItems[restaurantId];
  if (!restaurantUnavailableItems) return true;
  return !restaurantUnavailableItems.includes(itemName);
}

// Get current time in HH:MM format
export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Calculate delivery charges
// Rule: ₹10 per item, but flat ₹80 if total items >= 10
export function calculateDeliveryCharges(totalItems: number): number {
  return 0;
}