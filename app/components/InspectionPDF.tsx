import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 15 },
  label: { fontWeight: 'bold', marginBottom: 5 },
  text: { marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 5 },
  conditionBadge: { 
    padding: 5, 
    borderRadius: 3, 
    textTransform: 'capitalize'
  },
  photoSection: { marginTop: 10 },
  photoLabel: { fontWeight: 'bold', marginBottom: 5 },
  photoUrl: { fontSize: 10, color: '#666', marginBottom: 3 }
})

interface InspectionPDFProps {
  application: {
    tenant_name?: string
    email?: string
    property_address?: string
    landlord_inspection_condition?: string
    landlord_inspection_issues?: string
    landlord_inspection_date?: string
  }
  property?: {
    address: string
    unit?: string
  }
  photos?: string[]
}

export const InspectionPDF: React.FC<InspectionPDFProps> = ({ 
  application, 
  property,
  photos = [] 
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>Move-In Inspection Report</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Property:</Text>
        <Text style={styles.text}>
          {property?.address || application.property_address}
          {property?.unit ? `, Unit ${property.unit}` : ''}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tenant:</Text>
        <Text style={styles.text}>{application.tenant_name || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Inspection Date:</Text>
        <Text style={styles.text}>
          {application.landlord_inspection_date 
            ? new Date(application.landlord_inspection_date).toLocaleDateString()
            : 'N/A'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Overall Condition:</Text>
        <Text style={[styles.text, { textTransform: 'capitalize' }]}>
          {application.landlord_inspection_condition || 'Not specified'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Issues / Notes:</Text>
        <Text style={styles.text}>
          {application.landlord_inspection_issues || 'No issues noted'}
        </Text>
      </View>

      {photos.length > 0 && (
        <View style={styles.photoSection}>
          <Text style={styles.photoLabel}>Photos:</Text>
          {photos.map((url, i) => (
            <Text key={i} style={styles.photoUrl}>{url}</Text>
          ))}
        </View>
      )}

      <View style={{ marginTop: 30 }}>
        <Text style={styles.text}>_______________________________</Text>
        <Text style={styles.text}>Landlord Signature</Text>
      </View>
    </Page>
  </Document>
)