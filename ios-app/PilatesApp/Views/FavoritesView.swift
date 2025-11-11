//
//  FavoritesView.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

struct FavoritesView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @State private var favoriteExerciseIds: Set<String> = []
    @State private var favoriteExercises: [Exercise] = []
    
    var body: some View {
        NavigationView {
            Group {
                if favoriteExercises.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "star")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("즐겨찾기한 운동이 없습니다")
                            .font(.title3)
                            .foregroundColor(.secondary)
                        
                        Text("운동 상세 페이지에서 ⭐ 버튼을 눌러\n즐겨찾기에 추가하세요")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                } else {
                    List {
                        ForEach(favoriteExercises, id: \.objectID) { exercise in
                            NavigationLink(destination: ExerciseDetailView(exercise: exercise)) {
                                ExerciseRow(exercise: exercise)
                            }
                        }
                        .onDelete(perform: deleteFavorites)
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("즐겨찾기")
            .navigationBarTitleDisplayMode(.large)
            .onAppear {
                loadFavorites()
            }
            .refreshable {
                loadFavorites()
            }
        }
    }
    
    private func loadFavorites() {
        guard let data = UserDefaults.standard.data(forKey: "favoriteExercises"),
              let ids = try? JSONDecoder().decode([String].self, from: data) else {
            favoriteExercises = []
            return
        }
        
        favoriteExerciseIds = Set(ids)
        
        let request = NSFetchRequest<Exercise>(entityName: "Exercise")
        let exercises = (try? viewContext.fetch(request)) ?? []
        
        favoriteExercises = exercises.filter { exercise in
            let exerciseId = exercise.objectID.uriRepresentation().absoluteString
            return favoriteExerciseIds.contains(exerciseId)
        }
    }
    
    private func deleteFavorites(at offsets: IndexSet) {
        for index in offsets {
            let exercise = favoriteExercises[index]
            let exerciseId = exercise.objectID.uriRepresentation().absoluteString
            favoriteExerciseIds.remove(exerciseId)
        }
        
        if let data = try? JSONEncoder().encode(Array(favoriteExerciseIds)) {
            UserDefaults.standard.set(data, forKey: "favoriteExercises")
        }
        
        loadFavorites()
    }
}

















