// IMPORTANT: Replace with your local IP address
const API_URL = "http://YOUR_LOCAL_IP:3000/api/stopwatch";

export const getStopwatchState = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch stopwatch state");
  }
  return response.json();
};

export const syncStopwatchAction = async (action: string, body?: object) => {
  try {
    await fetch(`${API_URL}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
  } catch (error) {
    console.error(`Failed to sync action '${action}':`, error);
    // Optionally, handle sync errors here (e.g., show a toast message)
  }
};
