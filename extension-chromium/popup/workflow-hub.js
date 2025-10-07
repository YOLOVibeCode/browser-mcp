/**
 * Workflow Hub - Main navigation and progress tracking
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Workflow Hub loaded');

  // Check progress and update UI
  await checkProgress();

  // Workflow step cards
  document.querySelectorAll('.step-card').forEach(card => {
    card.addEventListener('click', () => {
      const page = card.dataset.page;
      if (page) {
        // Add 'from=workflow' parameter to track navigation
        const separator = page.includes('?') ? '&' : '?';
        window.location.href = `${page}${separator}from=workflow`;
      }
    });
  });

  // Quick navigation buttons
  document.querySelectorAll('.quick-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page) {
        window.location.href = page;
      }
    });
  });

  // Reset progress button
  document.getElementById('resetProgressBtn').addEventListener('click', async () => {
    if (confirm('Reset workflow progress? This will clear the test completion flag.')) {
      await chrome.storage.local.remove(['mcpTestsCompleted']);
      window.location.reload();
    }
  });
});

async function checkProgress() {
  try {
    // Check Step 1: Is MCP server running (companion app installed)?
    let step1Complete = false;
    try {
      const healthResponse = await fetch('http://localhost:3100/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        if (health.status === 'ok') {
          markStepComplete('step1');
          step1Complete = true;
        }
      }
    } catch (err) {
      // Server not running - don't mark complete
      console.log('MCP server not detected:', err.message);
    }

    // Check Step 2: Any tabs connected (actual state)?
    const tabsResponse = await chrome.runtime.sendMessage({
      type: 'GET_ALL_ACTIVE_TABS'
    });

    if (tabsResponse && tabsResponse.success && tabsResponse.data && tabsResponse.data.length > 0) {
      markStepComplete('step2');
    }

    // Check Step 3: Tests completed (persisted flag - user ran tests)?
    const testsCompleted = await chrome.storage.local.get(['mcpTestsCompleted']);
    if (testsCompleted.mcpTestsCompleted) {
      markStepComplete('step3');
    }

    // Update status banner
    updateStatusBanner();
  } catch (err) {
    console.error('Error checking progress:', err);
  }
}

function markStepComplete(stepId) {
  const step = document.getElementById(stepId);
  const status = document.getElementById(`${stepId}-status`);

  if (step) {
    step.classList.add('completed');
  }

  if (status) {
    status.textContent = 'Completed';
    status.className = 'step-status completed';
  }
}

function updateStatusBanner() {
  const banner = document.getElementById('statusBanner');
  const step1Done = document.getElementById('step1').classList.contains('completed');
  const step2Done = document.getElementById('step2').classList.contains('completed');
  const step3Done = document.getElementById('step3').classList.contains('completed');

  if (step1Done && step2Done && step3Done) {
    banner.innerHTML = `
      <strong>🎉 All Set!</strong>
      Your browser inspector is fully configured and ready to use. Open your IDE and start asking your AI assistant about your browser tabs!
    `;
    banner.style.background = '#d4edda';
    banner.style.borderColor = '#28a745';
  } else if (step1Done && step2Done) {
    banner.innerHTML = `
      <strong>📝 Almost Done!</strong>
      Tests passed! Now configure your IDE (Step 3) to start using the AI assistant.
    `;
  } else if (step1Done) {
    banner.innerHTML = `
      <strong>👍 Good Progress!</strong>
      Tab connected! Next, run tests (Step 2) to verify everything works.
    `;
  }
}
