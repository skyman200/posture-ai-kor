//
//  PilatesApp.swift
//  PilatesApp
//
//  Created on 2025-01-04.
//

import SwiftUI
import CoreData

@main
struct PilatesApp: App {
    let persistenceController = PersistenceController.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}


















