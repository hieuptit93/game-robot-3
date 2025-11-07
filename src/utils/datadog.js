import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

// Khởi tạo Datadog RUM
export const initDatadog = () => {
  // Chỉ khởi tạo trong production hoặc khi có biến môi trường
  datadogRum.init({
    applicationId: 'f289d01e-c669-4102-87c9-4a6f9c89c6b9',
    clientToken: 'pubda4c9b488f0cbc3d3d4b8b6f052b8081',
    site: 'us5.datadoghq.com',
    service: 'space-shooter-game',
    env: 'prod',
    // Specify a version number to identify the deployed version of your application in Datadog
    version: '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100, // Giảm xuống để tiết kiệm bandwidth
    defaultPrivacyLevel: 'mask-user-input',
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    plugins: [
      reactPlugin({
        router: false,
      })
    ],
    // Cấu hình để theo dõi lỗi
    beforeSend: (event) => {
      // Có thể filter hoặc modify events trước khi gửi
      // Thêm context về game nếu có
      if (event.type === 'action' || event.type === 'error') {
        event.context = {
          ...event.context,
          application: 'space-shooter-game',
          environment: 'prod'
        };
      }
      return event;
    }
  });

  // Bắt đầu theo dõi
  datadogRum.startSessionReplayRecording();

  console.log('Datadog RUM initialized successfully');
};

// Set user context for Datadog
export const setUserContext = (userId, userProperties = {}) => {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.setUser({
      id: userId,
      ...userProperties
    });
    console.log('Datadog user context set:', { id: userId, ...userProperties });
  }
};

// Clear user context
export const clearUserContext = () => {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.clearUser();
    console.log('Datadog user context cleared');
  }
};

// Utility functions để track custom events
export const trackGameEvent = (eventName, properties = {}) => {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.addAction(eventName, {
      ...properties,
      timestamp: Date.now()
    });
  }
};

export const trackGameError = (error, context = {}) => {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.addError(error, {
      ...context,
      source: 'game-logic'
    });
  }
};

export const trackUserAction = (actionName, element, properties = {}) => {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.addAction(actionName, {
      element: element?.tagName || 'unknown',
      ...properties
    });
  }
};

// Track game performance metrics
export const trackGameMetrics = (metrics) => {
  if (datadogRum.getInitConfiguration()) {
    Object.entries(metrics).forEach(([key, value]) => {
      datadogRum.addTiming(key, value);
    });
  }
};

// Track user session start with full context
export const trackUserSession = (userId, sessionData = {}) => {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.addAction('user_session_start', {
      userId,
      sessionId: datadogRum.getInternalContext()?.session_id,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      ...sessionData
    });
  }
};