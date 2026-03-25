const isTruthy = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

export const resolveDataMode = (req) => {
  const allowTestMode = isTruthy(process.env.ALLOW_TEST_MODE);
  const requestedTestMode = isTruthy(req.get('x-test-mode'));

  const isTestMode = allowTestMode && requestedTestMode;

  return {
    allowTestMode,
    requestedTestMode,
    isTestMode,
    mode: isTestMode ? 'test' : 'production'
  };
};

export const getTableNames = (req) => {
  const mode = req.dataMode || resolveDataMode(req);
  if (mode.isTestMode) {
    return {
      pagesTable: 'pages_test',
      historyTable: 'page_history_test'
    };
  }

  return {
    pagesTable: 'pages',
    historyTable: 'page_history'
  };
};

export const attachDataMode = (req, res, next) => {
  req.dataMode = resolveDataMode(req);
  res.set('X-Environment', req.dataMode.mode);
  next();
};

export const requireTestControlAuth = (req, res, next) => {
  const mode = req.dataMode || resolveDataMode(req);

  if (!mode.allowTestMode) {
    return res.status(403).json({
      error: 'Test mode is disabled on server'
    });
  }

  next();
};
