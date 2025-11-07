//
//  NewWorkoutProgramView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

struct NewWorkoutProgramView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    @Binding var programs: [WorkoutProgram]
    
    @State private var programName = ""
    @State private var programDescription = ""
    @State private var selectedExercises: [Exercise] = []
    @State private var showingExercisePicker = false
    
    var body: some View {
        NavigationView {
            Form {
                Section("프로그램 정보") {
                    TextField("프로그램 이름", text: $programName)
                    TextField("설명 (선택)", text: $programDescription)
                }
                
                Section("운동 목록") {
                    if selectedExercises.isEmpty {
                        Button(action: { showingExercisePicker = true }) {
                            HStack {
                                Image(systemName: "plus.circle")
                                Text("운동 추가")
                            }
                        }
                    } else {
                        ForEach(selectedExercises, id: \.objectID) { exercise in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(exercise.name ?? "알 수 없음")
                                        .font(.headline)
                                    if let equipment = exercise.equipment?.name {
                                        Text(equipment)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                Spacer()
                                Button(action: { removeExercise(exercise) }) {
                                    Image(systemName: "minus.circle.fill")
                                        .foregroundColor(.red)
                                }
                            }
                        }
                        
                        Button(action: { showingExercisePicker = true }) {
                            HStack {
                                Image(systemName: "plus.circle")
                                Text("운동 추가")
                            }
                        }
                    }
                }
            }
            .navigationTitle("새 프로그램")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("취소") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("저장") {
                        saveProgram()
                    }
                    .disabled(programName.isEmpty || selectedExercises.isEmpty)
                }
            }
            .sheet(isPresented: $showingExercisePicker) {
                ExercisePickerView(selectedExercises: $selectedExercises)
            }
        }
    }
    
    private func removeExercise(_ exercise: Exercise) {
        selectedExercises.removeAll { $0.objectID == exercise.objectID }
    }
    
    private func saveProgram() {
        let exerciseItems = selectedExercises.map { exercise in
            ExerciseItem(
                exerciseId: exercise.objectID.uriRepresentation().absoluteString,
                exerciseName: exercise.name ?? "알 수 없음",
                sets: 3,
                reps: 10,
                notes: ""
            )
        }
        
        let program = WorkoutProgram(
            name: programName,
            description: programDescription,
            exercises: exerciseItems
        )
        
        programs.append(program)
        
        if let data = try? JSONEncoder().encode(programs) {
            UserDefaults.standard.set(data, forKey: "workoutPrograms")
        }
        
        dismiss()
    }
}

struct ExercisePickerView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    @Binding var selectedExercises: [Exercise]
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Exercise.name, ascending: true)],
        animation: .default)
    private var exercises: FetchedResults<Exercise>
    
    var body: some View {
        NavigationView {
            List {
                ForEach(exercises, id: \.objectID) { exercise in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(exercise.name ?? "알 수 없음")
                                .font(.headline)
                            if let equipment = exercise.equipment?.name {
                                Text(equipment)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Spacer()
                        
                        if selectedExercises.contains(where: { $0.objectID == exercise.objectID }) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                        }
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        toggleExercise(exercise)
                    }
                }
            }
            .navigationTitle("운동 선택")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("완료") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func toggleExercise(_ exercise: Exercise) {
        if let index = selectedExercises.firstIndex(where: { $0.objectID == exercise.objectID }) {
            selectedExercises.remove(at: index)
        } else {
            selectedExercises.append(exercise)
        }
    }
}









