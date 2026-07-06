import React, { useState, useEffect, useRef } from 'react';
import StatusMessage from '../../ui/StatusMessage';
import { motion } from 'framer-motion';
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";
import "@material/web/icon/icon.js";

const EditCategoryPage = ({ statusMessage, setStatusMessage, onClose, category, onUpdate }) => {
    const [name, setName] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const value = inputRef.current.value;
                inputRef.current.setSelectionRange(value.length, value.length);
            }
        }, 100);
    }, []);

    useEffect(() => {
        if (category) {
            setName(category.name);
        }
    }, [category]);

    const handleNameUpdate = async () => {
        if (!name.trim()) {
            setStatusMessage("Name cannot be empty.");
            return;
        }

        if (name.trim().toLowerCase() === 'general') {
            setStatusMessage("'General' is a reserved name.");
            return;
        }

        try {
            const response = await fetch(`/api/category/${category.code}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const data = await response.json();
            setStatusMessage(data.message || data.error);
            if(response.ok) onUpdate();
        } catch (error) {
            setStatusMessage('Could not update name.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleNameUpdate();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div
            className="relative bg-[var(--theme-card-bg)] p-6 rounded-xl border border-[var(--theme-outline)] backdrop-blur-lg h-full flex flex-col items-center justify-center overflow-y-auto"
        >
            <div className="absolute top-6 right-6 z-10">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-outlined-icon-button onClick={onClose}>
                        <md-icon>close</md-icon>
                    </md-outlined-icon-button>
                </motion.div>
            </div>

            <StatusMessage message={statusMessage} onDismiss={() => setStatusMessage("")} />
            <h1 className="text-3xl font-bold mb-6 text-center text-[var(--theme-text)]">Edit Category</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6" noValidate>
                <md-outlined-text-field
                    ref={inputRef}
                    class="w-full"
                    placeholder="Name"
                    value={name}
                    onInput={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                ></md-outlined-text-field>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <md-filled-button type="submit" class="w-full">
                        Update
                    </md-filled-button>
                </motion.div>
            </form>
        </div>
    );
};

export default EditCategoryPage;
