import { describe, expect, it } from 'vitest';
import { validatePublicConfig } from '../../scripts/public-config.mjs';

const ready = {
  TUNNEL_TOKEN: 'fictional-token',
  LAB_MODE: 'secured',
  HTTPS_ENABLED: 'true',
  HOST_BIND_IP: '127.0.0.1',
  TRUST_PROXY: 'false',
  APP_ORIGIN: 'https://lab.example.com',
};

describe('public starter guard', () => {
  it('accepts an Access-gated tunnel configuration', () => {
    expect(validatePublicConfig(ready)).toEqual([]);
  });

  it.each([
    [{ TUNNEL_TOKEN: '' }, 'TUNNEL_TOKEN'],
    [{ LAB_MODE: 'vulnerable' }, 'LAB_MODE=secured'],
    [{ HTTPS_ENABLED: 'false' }, 'HTTPS_ENABLED=true'],
    [{ HOST_BIND_IP: '0.0.0.0' }, 'HOST_BIND_IP=127.0.0.1'],
    [{ TRUST_PROXY: 'true' }, 'TRUST_PROXY=false'],
    [{ APP_ORIGIN: 'http://localhost:8080' }, 'APP_ORIGIN'],
    [{ APP_ORIGIN: 'https://127.0.0.1' }, 'APP_ORIGIN'],
  ])('rejects an unsafe or incomplete public setting', (change, expected) => {
    expect(validatePublicConfig({ ...ready, ...change }).join(' ')).toContain(expected);
  });
});
