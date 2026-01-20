import styles from './style.module.css';

/**
 * Multi-brand Button Component (Global Architecture)
 * @param {Object} props
 * @param {string} props.label - Button text
 * @param {function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 */
const Button = ({ label, onClick, disabled = false }) => {
  return (
    <button 
      className={`${styles.button} ${disabled ? styles.disabled : ''}`} 
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;
