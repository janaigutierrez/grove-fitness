const bcrypt = require('bcryptjs');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// ========== CHANGE USERNAME ==========
const changeUsername = async (userId, newUsername) => {
    // Validar que el username no esté tomado
    const existingUser = await User.findOne({ username: newUsername });

    if (existingUser && existingUser._id.toString() !== userId.toString()) {
        const error = new Error('Username already taken');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { username: newUsername },
        { new: true }
    ).select('-password -refresh_tokens -blacklisted_tokens');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        message: 'Username updated successfully',
        user: {
            id: user._id.toString(),
            username: user.username,
            name: user.name,
            email: user.email
        }
    };
};

// ========== CHANGE PASSWORD ==========
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
    }

    // Hash nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // INVALIDAR TODOS LOS TOKENS (seguridad)
    user.refresh_tokens = [];
    user.blacklisted_tokens = [];

    await user.save();

    return {
        message: 'Password changed successfully. Please login again with your new password.',
        tokens_invalidated: true
    };
};

// ========== UPLOAD AVATAR ==========
const uploadAvatar = async (userId, file) => {
    const fs = require('fs').promises;

    if (!file) {
        const error = new Error('No file provided');
        error.statusCode = 400;
        throw error;
    }

    try {
        // Upload a Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'grove-fitness/avatars',
            public_id: `user-${userId.toString()}`,
            overwrite: true,
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });

        // Delete temporary file after upload
        try {
            await fs.unlink(file.path);
        } catch (unlinkError) {
            console.error('Error deleting temp file:', unlinkError);
        }

        // Guardar URL en BD
        const user = await User.findByIdAndUpdate(
            userId,
            { avatar_url: result.secure_url },
            { new: true }
        ).select('avatar_url name email');

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return {
            message: 'Avatar uploaded successfully',
            avatar_url: user.avatar_url,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar_url: user.avatar_url
            }
        };
    } catch (error) {
        // Clean up temp file if upload failed
        if (file && file.path) {
            try {
                const fs = require('fs').promises;
                await fs.unlink(file.path);
            } catch (unlinkError) {
                console.error('Error deleting temp file after failed upload:', unlinkError);
            }
        }

        console.error('Cloudinary upload error:', error);
        const err = new Error(error.message || 'Failed to upload avatar');
        err.statusCode = 500;
        throw err;
    }
};

// ========== DELETE AVATAR ==========
const deleteAvatar = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Si tiene avatar en Cloudinary, eliminarlo
    if (user.avatar_url) {
        try {
            const publicId = `grove-fitness/avatars/user-${userId.toString()}`;
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Error deleting from Cloudinary:', error);
        }
    }

    // Eliminar URL de BD
    user.avatar_url = null;
    await user.save();

    return {
        message: 'Avatar deleted successfully',
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar_url: null
        }
    };
};

// ========== ADD WEIGHT ENTRY ==========
const addWeightEntry = async (userId, weight) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Añadir entrada al historial
    if (!user.weight_history) {
        user.weight_history = [];
    }

    user.weight_history.push({
        weight: weight,
        date: new Date()
    });

    // Actualizar peso actual
    user.weight = weight;

    await user.save();

    return {
        message: 'Weight entry added successfully',
        current_weight: weight,
        weight_history: user.weight_history.map(entry => ({
            weight: entry.weight,
            date: entry.date
        }))
    };
};

// ========== GET WEIGHT HISTORY ==========
const getWeightHistory = async (userId, limit = 30) => {
    const user = await User.findById(userId).select('weight_history weight');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Devolver últimas 'limit' entradas, ordenadas por fecha
    const history = user.weight_history
        ? user.weight_history
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
            .map(entry => ({
                weight: entry.weight,
                date: entry.date
            }))
        : [];

    return {
        current_weight: user.weight,
        weight_history: history
    };
};

module.exports = {
    changeUsername,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    addWeightEntry,
    getWeightHistory
};