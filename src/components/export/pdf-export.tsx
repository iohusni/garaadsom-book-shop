'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Transaction {
  id: string
  transactionDate: string
  amountGained: number
  amountSpent: number
  note?: string
}

interface Book {
  id: string
  title: string
  startDate: string
  endDate: string
  status: string
}

interface PDFExportProps {
  book: Book
  transactions: Transaction[]
  userStats: {
    totalGained: number
    totalSpent: number
    netAmount: number
  }
  userName: string
}

export default function PDFExport({
  book,
  transactions,
  userStats,
  userName,
}: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    setIsGenerating(true)

    try {
      // Create a temporary div for PDF content
      const pdfContent = document.createElement('div')
      pdfContent.style.padding = '20px'
      pdfContent.style.fontFamily = 'Arial, sans-serif'
      pdfContent.style.backgroundColor = 'white'
      pdfContent.style.color = 'black'
      pdfContent.style.width = '800px'

      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin-bottom: 10px;">Garaadsom Book Portal</h1>
          <h2 style="color: #6b7280; font-size: 18px;">Weekly Summary Report</h2>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            Book Information
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div>
              <strong>Book Title:</strong> ${book.title}<br>
              <strong>Status:</strong> ${book.status}<br>
              <strong>User:</strong> ${userName}
            </div>
            <div>
              <strong>Start Date:</strong> ${new Date(
                book.startDate,
              ).toLocaleDateString()}<br>
              <strong>End Date:</strong> ${new Date(
                book.endDate,
              ).toLocaleDateString()}<br>
              <strong>Total Transactions:</strong> ${transactions.length}
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            Financial Summary
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div style="text-align: center; padding: 15px; background-color: #dcfce7; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #166534;">$${userStats.totalGained.toFixed(
                2,
              )}</div>
              <div style="color: #166534;">Total Gained</div>
            </div>
            <div style="text-align: center; padding: 15px; background-color: #fef2f2; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #dc2626;">$${userStats.totalSpent.toFixed(
                2,
              )}</div>
              <div style="color: #dc2626;">Total Spent</div>
            </div>
            <div style="text-align: center; padding: 15px; background-color: ${
              userStats.netAmount >= 0 ? '#dcfce7' : '#fef2f2'
            }; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: ${
                userStats.netAmount >= 0 ? '#166534' : '#dc2626'
              };">$${userStats.netAmount.toFixed(2)}</div>
              <div style="color: ${
                userStats.netAmount >= 0 ? '#166534' : '#dc2626'
              };">Net Amount</div>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            Transaction Details
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left;">Date</th>
                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">Gained</th>
                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">Spent</th>
                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left;">Note</th>
              </tr>
            </thead>
            <tbody>
              ${transactions
                .map(
                  (transaction) => `
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 12px;">${new Date(
                    transaction.transactionDate,
                  ).toLocaleDateString()}</td>
                  <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; color: #166534;">${
                    transaction.amountGained > 0
                      ? `$${transaction.amountGained.toFixed(2)}`
                      : '-'
                  }</td>
                  <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; color: #dc2626;">${
                    transaction.amountSpent > 0
                      ? `$${transaction.amountSpent.toFixed(2)}`
                      : '-'
                  }</td>
                  <td style="border: 1px solid #d1d5db; padding: 12px;">${
                    transaction.note || '-'
                  }</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px;">
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>Garaadsom Book Portal - Financial Management System</p>
        </div>
      `

      document.body.appendChild(pdfContent)

      // Convert to canvas
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      // Remove temporary element
      document.body.removeChild(pdfContent)

      // Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Download PDF
      const fileName = `${book.title.replace(/\s+/g, '_')}_${userName.replace(
        /\s+/g,
        '_',
      )}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Export Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Generate a detailed PDF report of your weekly transactions and
          financial summary.
        </p>
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export as PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
