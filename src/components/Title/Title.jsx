import styles from './style.module.css';

/**
 * Multi-brand Title Component
 * @param {Object} props
 * @param {string} props.text - Title text
 * @param {'h1' | 'h2' | 'h3'} props.level - Heading level
 */
const Title = ({ text, level = 'h1' }) => {
  const Tag = level;
  
  return (
    <Tag className={styles.title}>
      {text}
    </Tag>
  );
};

export default Title;
