/**
 * PM2 Ecosystem Configuration for Rindell AI MVP
 * 
 * Production-ready process management configuration
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 logs rindell-mvp
 *   pm2 restart rindell-mvp
 *   pm2 stop rindell-mvp
 *   pm2 delete rindell-mvp
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'rindell-mvp',
      
      // Entry point
      script: './server.js',
      
      // Working directory
      cwd: './',
      
      // Node.js args
      node_args: '',
      
      // Arguments passed to script
      args: '',
      
      // Execution mode
      exec_mode: 'fork', // Use 'cluster' for multi-core
      instances: 1,       // Number of instances (use 'max' for cluster mode)
      
      // Auto-restart behavior
      autorestart: true,
      watch: false,       // Set to true for development
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        'logs',
        'temp',
        'user-data',
        '.git',
        '*.log'
      ],
      
      // Memory management
      max_memory_restart: '1G',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        API_PORT: 3000,
        WEB_PORT: 8080
      },
      
      // Development environment
      env_development: {
        NODE_ENV: 'development',
        API_PORT: 3000,
        WEB_PORT: 8080
      },
      
      // Production environment
      env_production: {
        NODE_ENV: 'production',
        API_PORT: 3000,
        WEB_PORT: 8080
      },
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Log rotation
      max_size: '50M',
      max_files: 10,
      compress: true,
      
      // Process restart delay
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Kill timeout
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Source map support
      source_map_support: true,
      
      // Disable auto exit
      autorestart: true,
      
      // Cron restart (optional - restart daily at 3am)
      // cron_restart: '0 3 * * *',
      
      // Post-deploy hooks (optional)
      // post_update: ['npm install', 'echo Deployment complete'],
      
      // Instance variables
      instance_var: 'INSTANCE_ID'
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'azureuser',
      host: 'YOUR_VPS_IP',
      ref: 'origin/copilot/na',
      repo: 'git@github.com:DukeVTI/Rindell-Ai.git',
      path: '/home/azureuser/rindell/Rindell-Ai',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production && pm2 save'
    }
  }
};
