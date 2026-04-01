const { useAzureMonitor } = require('@azure/monitor-opentelemetry');

const initializeAzureMonitor = () => {
  try {
    if (process.env.AZURE_MONITOR_CONNECTION_STRING) {
      useAzureMonitor({
        azureMonitorExporterOptions: {
          connectionString: process.env.AZURE_MONITOR_CONNECTION_STRING,
        },
      });
      console.log('Azure Monitor initialized successfully');
    } else {
      console.warn('Azure Monitor not configured');
    }
  } catch (error) {
    console.error('Azure Monitor initialization failed:', error.message);
  }
};

const logEvent = (eventName, properties = {}) => {
  console.log(`[AUDIT] ${eventName}:`, JSON.stringify(properties));
};

module.exports = { initializeAzureMonitor, logEvent };
