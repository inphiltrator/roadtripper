<script lang="ts">
  import { onMount } from 'svelte';
  
  let testResults: any = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const response = await fetch('/api/test-regional');
      const data = await response.json();
      
      if (data.success) {
        testResults = data.results;
      } else {
        error = data.message || 'Test failed';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  });

  const getStatusIcon = (passed: boolean) => passed ? '✅' : '❌';
  const getStatusColor = (passed: boolean) => passed ? 'text-green-400' : 'text-red-400';
</script>

<svelte:head>
  <title>Regional Features Test Suite</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-yellow-900 p-8">
  <div class="max-w-6xl mx-auto">
    
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-2">🏜️ Southwest USA Regional Features</h1>
      <h2 class="text-2xl text-orange-200">Test Suite Results</h2>
    </div>

    {#if loading}
      <div class="text-center">
        <div 
          class="inline-block p-8 rounded-2xl shadow-2xl ring-1 ring-amber-500/20 backdrop-blur-lg"
          style="background-color: rgba(255,255,255,0.1);"
        >
          <div class="text-white text-xl mb-4">🧪 Running Regional Feature Tests...</div>
          <div class="animate-pulse text-orange-200">Testing Southwest USA capabilities</div>
        </div>
      </div>
    {:else if error}
      <div class="text-center">
        <div 
          class="inline-block p-8 rounded-2xl shadow-2xl ring-1 ring-red-500/20 backdrop-blur-lg"
          style="background-color: rgba(255,0,0,0.1);"
        >
          <div class="text-red-400 text-xl mb-2">❌ Test Suite Failed</div>
          <div class="text-red-200">{error}</div>
        </div>
      </div>
    {:else if testResults}
      
      <!-- Summary Card -->
      <div 
        class="mb-8 p-6 rounded-2xl shadow-2xl ring-1 ring-amber-500/20 backdrop-blur-lg"
        style="background-color: rgba(255,255,255,0.1);"
      >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-3xl font-bold text-white">{testResults.summary.total}</div>
            <div class="text-orange-200">Total Tests</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-green-400">{testResults.summary.passed}</div>
            <div class="text-orange-200">Passed</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-red-400">{testResults.summary.failed}</div>
            <div class="text-orange-200">Failed</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-blue-400">{testResults.summary.duration}ms</div>
            <div class="text-orange-200">Duration</div>
          </div>
        </div>
        
        <div class="mt-6 text-center">
          <div class="text-2xl font-bold {getStatusColor(testResults.summary.failed === 0)}">
            {#if testResults.summary.failed === 0}
              🎉 All Regional Features Working!
            {:else}
              ⚠️ Some Tests Failed
            {/if}
          </div>
        </div>
      </div>

      <!-- Test Results -->
      <div class="grid gap-4">
        {#each testResults.tests as test, index}
          <div 
            class="p-6 rounded-2xl shadow-2xl ring-1 ring-amber-500/20 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02]"
            style="background-color: rgba(255,255,255,0.1);"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-semibold text-white flex items-center gap-3">
                <span class="text-2xl">{getStatusIcon(test.passed)}</span>
                {test.name}
              </h3>
              <span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(test.passed)} bg-black/20">
                {test.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>

            <!-- Test Details -->
            {#if test.details}
              <div class="bg-black/20 rounded-lg p-4">
                <pre class="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
{JSON.stringify(test.details, null, 2)}
                </pre>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Footer Info -->
      <div class="mt-8 text-center text-orange-200">
        <div class="mb-2">Test completed at: {new Date(testResults.timestamp).toLocaleString()}</div>
        <div class="text-sm">
          🚗 Ready for Southwest USA roadtrips with advanced regional geo-routing!
        </div>
      </div>

    {/if}
  </div>
</div>
