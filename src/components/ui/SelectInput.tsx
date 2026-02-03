import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { cn } from '../../lib/utils';
import { ChevronDown, Check } from 'lucide-react-native';

interface Option {
  label: string;
  value: string;
}

interface SelectInputProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  error?: string;
  disabled?: boolean;
}

export function SelectInput({
  label,
  placeholder = "Select option",
  options,
  value,
  onChange,
  multiple = false,
  error,
  disabled = false
}: SelectInputProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setModalVisible(false);
    }
  };

  const isSelected = (optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  const getDisplayValue = () => {
    if (!value || (Array.isArray(value) && value.length === 0)) return placeholder;
    
    if (multiple) {
        if (Array.isArray(value)) {
            return value.map(v => options.find(o => o.value === v)?.label).join(', ');
        }
        return placeholder;
    }
    
    return options.find(o => o.value === value)?.label || placeholder;
  };

  return (
    <View className="space-y-2 w-full">
      {label && <Text className="text-sm font-medium text-foreground">{label}</Text>}
      
      <TouchableOpacity
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.7}
        className={cn(
          "flex-row items-center justify-between h-12 w-full rounded-md border border-input bg-background px-3 py-2",
          error && "border-destructive",
          disabled && "opacity-50 bg-muted/20"
        )}
      >
        <Text
            numberOfLines={1}
            className={cn(
            "text-sm flex-1 mr-2",
            (!value || (Array.isArray(value) && value.length === 0)) ? "text-muted-foreground" : "text-foreground"
            )}
        >
          {getDisplayValue()}
        </Text>
        <ChevronDown size={16} className="text-muted-foreground" />
      </TouchableOpacity>
      
      {error && <Text className="text-xs text-destructive">{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <TouchableWithoutFeedback>
              <View className="bg-background rounded-t-xl max-h-[70%]">
                <View className="p-4 border-b border-border flex-row justify-between items-center">
                  <Text className="font-bold text-lg text-foreground">
                    {placeholder}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text className="text-primary font-medium">Done</Text>
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={options}
                  keyExtractor={item => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSelect(item.value)}
                      className="flex-row items-center justify-between p-4 border-b border-border/50"
                    >
                      <Text className={cn(
                        "text-base",
                        isSelected(item.value) ? "text-primary font-semibold" : "text-foreground"
                      )}>
                        {item.label}
                      </Text>
                      {isSelected(item.value) && (
                        <Check size={20} className="text-primary" />
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerClassName="pb-8"
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
