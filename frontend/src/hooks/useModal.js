import { useState } from 'react';

/**
 * Custom hook for managing modal state
 * Returns state and handlers for opening/closing modals with data
 */
export default function useModal() {
  const [visible, setVisible] = useState(false);
  const [modalData, setModalData] = useState({});

  const openModal = (data = {}) => {
    setModalData(data);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
    // Clear data after animation completes
    setTimeout(() => setModalData({}), 300);
  };

  return {
    visible,
    modalData,
    openModal,
    closeModal,
  };
}
