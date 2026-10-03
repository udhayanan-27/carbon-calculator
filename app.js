let chartInstance = null;

window.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
});

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginBtn = document.getElementById('loginTabBtn');
  const regBtn = document.getElementById('registerTabBtn');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginBtn.classList.add('active');
    regBtn.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginBtn.classList.remove('active');
    regBtn.classList.add('active');
  }
}

function checkAuthState() {
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName');
  const authContainer = document.getElementById('authContainer');
  const appContainer = document.getElementById('appContainer');

  if (token) {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    document.getElementById('userDisplayName').innerText = userName || 'User';
    loadHistory();
  } else {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    document.getElementById('historyList').innerHTML = '<li>No past calculations found.</li>';
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.name);
      document.getElementById('registerForm').reset();
      checkAuthState();
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Server error during registration.');
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.name);
      document.getElementById('loginForm').reset();
      checkAuthState();
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Server error during login.');
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const resultSection = document.getElementById('resultSection');
  if (resultSection) {
    resultSection.classList.add('hidden');
  }

  checkAuthState();
}

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    alert('Session expired. Please log in again.');
    handleLogout();
    return null;
  }

  return response.json();
}

async function handleCalculate(e) {
  e.preventDefault();

  const payload = {
    electricity: document.getElementById('electricity').value,
    petrolKm: document.getElementById('petrolKm').value,
    diet: document.getElementById('diet').value
  };

  const result = await fetchWithAuth('/api/calculate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (result && result.success) {
    const emissions = result.data.emissions;

    document.getElementById('totalOutput').innerText = emissions.total;
    document.getElementById('resultSection').classList.remove('hidden');

    renderChart(
      emissions.electricityEmission,
      emissions.transportEmission,
      emissions.dietEmission
    );

    loadHistory();
  }
}

async function loadHistory() {
  const data = await fetchWithAuth('/api/history');

  if (data && data.success) {
    const historyList = document.getElementById('historyList');

    if (!data.history || data.history.length === 0) {
      historyList.innerHTML = '<li>No past calculations found.</li>';
      return;
    }

    historyList.innerHTML = data.history
      .map(
        (item) => `
          <li>
            <strong>${item.emissions.total} kg CO₂e</strong>
            <small>(${new Date(item.createdAt).toLocaleDateString()})</small>
          </li>
        `
      )
      .join('');
  }
}

function renderChart(elec, transport, diet) {
  const canvas = document.getElementById('emissionChart');
  const ctx = canvas.getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Electricity', 'Transport', 'Diet'],
      datasets: [
        {
          data: [elec, transport, diet],
          backgroundColor: ['#f39c12', '#e74c3c', '#2ecc71']
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}
