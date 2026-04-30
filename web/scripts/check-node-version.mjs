const requiredMajor = 22;
const requiredMinor = 12;

const parseVersion = (raw) => {
  const cleaned = raw.replace(/^v/, '');
  const [major, minor, patch] = cleaned.split('.').map((part) => Number(part || 0));
  return { major, minor, patch };
};

const current = parseVersion(process.version);
const isSupported =
  current.major > requiredMajor ||
  (current.major === requiredMajor && current.minor >= requiredMinor);

if (!isSupported) {
  console.error(
    `Node ${process.version} is unsupported. Please use Node >=${requiredMajor}.${requiredMinor}.0 (for example: nvm use 24.15.0).`,
  );
  process.exit(1);
}
