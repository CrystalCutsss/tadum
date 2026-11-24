// Реферальная ссылка (SP-02 §1, A1, A2): текст для WhatsApp, имя файла QR, матрица QR, копирование и отправка.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyText, qrFileName, qrMatrix, shareLink, shareMessage, whatsappShareUrl } from './referral';

const URL_ = 'https://tadum.sa/s/zahrat-al-madina';

afterEach(() => vi.unstubAllGlobals());

describe('share-referral model', () => {
  it('wa.me без номера, текст и ссылка закодированы целиком', () => {
    const href = whatsappShareUrl(shareMessage('اشترِ الآن & سدّد', URL_));
    expect(href.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(href.slice('https://wa.me/?text='.length))).toBe(`اشترِ الآن & سدّد\n${URL_}`);
  });

  it('имя файла QR — tadum-{slug}-qr.png', () => {
    expect(qrFileName('zahrat-al-madina')).toBe('tadum-zahrat-al-madina-qr.png');
  });

  it('матрица QR квадратная, с тихой зоной 4 модуля', () => {
    const { size, data } = qrMatrix(URL_);
    expect(data).toHaveLength(size);
    expect(data.every((row) => row.length === size)).toBe(true);
    // Тихая зона: первые 4 строки — светлые.
    expect(data.slice(0, 4).flat().some(Boolean)).toBe(false);
    expect(data.flat().some(Boolean)).toBe(true);
  });

  it('копирование: Clipboard API есть — true, нет или отказ — false (SP-02 A1)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await expect(copyText(URL_)).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith(URL_);
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    await expect(copyText(URL_)).resolves.toBe(false);
    vi.stubGlobal('navigator', {});
    await expect(copyText(URL_)).resolves.toBe(false);
  });

  it('отправка: Web Share, отмена листа, запасной wa.me (SP-02 §1, A2)', async () => {
    const open = vi.fn();
    vi.stubGlobal('navigator', { share: vi.fn().mockResolvedValue(undefined) });
    await expect(shareLink('m', open)).resolves.toBe('web_share');
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError')) });
    await expect(shareLink('m', open)).resolves.toBe('cancelled');
    expect(open).not.toHaveBeenCalled();
    vi.stubGlobal('navigator', {});
    await expect(shareLink('m', open)).resolves.toBe('wa_me');
    expect(open).toHaveBeenCalledWith('https://wa.me/?text=m');
  });
});
