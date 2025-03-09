try {
  if (process.version !== 'v20.14.0') {
    console.error('NVM version incorrect. Version 20.14.0 requise !');
    process.exit(1);
  }
} catch (error) {
  process.exit(1);
}
