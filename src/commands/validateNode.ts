try {
  if (process.version !== 'v20.14.0') {
    console.error('NVM version incorrect. Version 20.14.0 requise !');
    process.exit(1);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error) {
  process.exit(1);
}
