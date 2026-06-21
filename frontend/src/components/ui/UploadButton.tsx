import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './UploadButton.module.css';

interface Props {
  onUpload: (file: File) => void;
  loading: boolean;
}

export function UploadButton({ onUpload, loading }: Props): JSX.Element {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = (): void => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <>
      <button
        className={styles.button}
        onClick={handleClick}
        disabled={loading}
        type="button"
      >
        {loading ? t('upload.loading') : t('upload.button')}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".sav,.json"
        onChange={handleChange}
        className={styles.hidden}
      />
    </>
  );
}
