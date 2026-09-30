module.exports = {
  apps: [{
    name: "blixbet",
    script: "artifacts/api-server/dist/index.mjs",
    env: {
      NODE_ENV: "production",
      PORT: 8080,
    },
    instances: 1,
    exec_mode: "fork",
    max_memory_restart: "512M",
    watch: false,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
    merge_logs: true,
  }],
};
