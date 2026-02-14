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
  containerClassName?: string;
}

export function SelectInput({
  label,
  placeholder = "Select option",
  options,
  value,
  onChange,
  multiple = false,
  error,
  disabled = false,
  containerClassName
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
    <View className={cn("w-full mb-4", containerClassName)}>
      {label && (
        <Text className="text-[13px] font-semibold text-muted-foreground mb-1.5 ml-0.5">
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.7}
        className={cn(
          "flex-row items-center justify-between h-14 w-full rounded-xl border border-input bg-background/50 px-4 py-2",
          error && "border-destructive",
          disabled && "opacity-50 bg-muted/20"
        )}
      >
        <Text
            numberOfLines={1}
            className={cn(
            "text-base flex-1 mr-2",
            (!value || (Array.isArray(value) && value.length === 0)) ? "text-muted-foreground" : "text-foreground"
            )}
        >
          {getDisplayValue()}
        </Text>
        <ChevronDown size={20} className="text-muted-foreground" />
      </TouchableOpacity>
      
      {error && <Text className="text-xs text-destructive mt-1 ml-1">{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View className="flex-1 justify-end bg-black/40">
            <TouchableWithoutFeedback>
              <View className="bg-background rounded-t-[32px] max-h-[80%] shadow-2xl">
                <View className="items-center pt-3 pb-1">
                  <View className="w-12 h-1.5 bg-muted rounded-full" />
                </View>

                <View className="px-6 py-4 border-b border-border/50 flex-row justify-between items-center">
                  <Text className="font-bold text-xl text-foreground">
                    {placeholder}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text className="text-primary font-bold text-base">Done</Text>
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={options}
                  keyExtractor={item => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSelect(item.value)}
                      className="flex-row items-center justify-between px-6 py-5 border-b border-border/30"
                      activeOpacity={0.6}
                    >
                      <Text className={cn(
                        "text-base",
                        isSelected(item.value) ? "text-primary font-bold" : "text-foreground font-medium"
                      )}>
                        {item.label}
                      </Text>
                      {isSelected(item.value) && (
                        <Check size={22} className="text-primary" />
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerClassName="pb-10"
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
