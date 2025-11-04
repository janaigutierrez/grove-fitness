import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutCard({ workout, onStart }) {
    return (
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-lg">
            {/* Header */}
            <View className="flex-row items-center mb-3">
                <Ionicons name="barbell" size={22} color="#4CAF50" />
                <Text className="text-lg font-bold text-grove-primary ml-2 flex-1">
                    {workout.name}
                </Text>
            </View>

            {/* Badges */}
            <View className="flex-row gap-2 mb-3 flex-wrap">
                <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-xs text-green-700 font-medium">
                        ⏱ {workout.estimated_duration || 30} min
                    </Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-xs text-green-700 font-medium">
                        🔥 {workout.difficulty || 'intermediate'}
                    </Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-xs text-green-700 font-medium">
                        {workout.exercises?.length || 0} exercicis
                    </Text>
                </View>
            </View>

            {/* Description */}
            {workout.description && (
                <Text className="text-sm text-gray-600 mb-3">
                    {workout.description}
                </Text>
            )}

            {/* Exercises Preview */}
            {workout.exercises && workout.exercises.length > 0 && (
                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                    <Text className="text-sm font-semibold text-green-800 mb-2">
                        Exercicis:
                    </Text>
                    {workout.exercises.slice(0, 3).map((ex, idx) => (
                        <View key={idx} className="flex-row justify-between items-center py-1">
                            <Text className="text-sm text-gray-700 flex-1">
                                • {ex.exercise_id?.name || 'Exercici'}
                            </Text>
                            <Text className="text-xs text-gray-500 font-medium">
                                {ex.custom_sets || ex.exercise_id?.default_sets || 3}x
                                {ex.custom_reps || ex.exercise_id?.default_reps || 10}
                            </Text>
                        </View>
                    ))}
                    {workout.exercises.length > 3 && (
                        <Text className="text-xs text-gray-500 italic mt-1">
                            +{workout.exercises.length - 3} més...
                        </Text>
                    )}
                </View>
            )}

            {/* Start Button */}
            <TouchableOpacity
                className="bg-green-600 py-3 rounded-xl flex-row items-center justify-center active:bg-green-700"
                onPress={() => onStart(workout)}
            >
                <Ionicons name="play" size={18} color="white" />
                <Text className="text-white font-bold ml-2">COMENÇAR</Text>
            </TouchableOpacity>
        </View>
    );
}