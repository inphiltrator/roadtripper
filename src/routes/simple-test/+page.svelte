<svelte:head>
  <title>Simple Test</title>
</svelte:head>

<div class="trip-planner h-screen w-screen flex flex-col">
  <div class="controls p-4 bg-gray-100">
    <h1 class="text-xl font-bold mb-4">Simple Test Page</h1>
    <form method="POST">
      <div class="flex space-x-4">
        <input type="text" name="start" placeholder="Start" class="p-2 border rounded w-full" required>
        <input type="text" name="destination" placeholder="Destination" class="p-2 border rounded w-full" required>
        <button type="submit" class="bg-blue-500 text-white p-2 rounded">Calculate Route</button>
      </div>
    </form>
  </div>
  <div class="map-container flex-grow bg-gray-200 flex items-center justify-center">
    <p>Map would be here</p>
  </div>
</div>
