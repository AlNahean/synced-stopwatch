// IMPORTANT: Replace with your local IP address
const API_URL = "http://YOUR_LOCAL_IP:3000/api/stopwatch";

export const getStopwatchState = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch stopwatch state");
  }
  return response.json();
};
